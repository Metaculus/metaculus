import logging

from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request

from users.models import User

logger = logging.getLogger(__name__)


class ActingUserSerializer(serializers.Serializer):
    """
    Optional `acting_user` param: the id or username of the account a request
    acts as. Only add this to endpoints that should support acting on behalf
    of others.
    """

    acting_user = serializers.CharField(required=False, allow_null=True)


def can_act_as(requester: User, target: User) -> bool:
    """
    - Anyone may act as themselves or as one of their own bots
    - Accounts with `can_act_as_metac_bots` may act as any active metac bot
    - Superusers may act as any account
    """

    if requester.is_superuser or target.id == requester.id:
        return True

    if target.is_bot and target.bot_owner_id == requester.id:
        return True

    return requester.can_act_as_metac_bots and target.is_active and target.is_metac_bot


def resolve_acting_user(
    requester: User, acting_user: str | int | None = None, path: str = ""
) -> User:
    """
    Resolves the account a request acts as, defaulting to the requester.
    `acting_user` is a user id if it's all digits, otherwise a username.

    Missing targets are a 404 for superusers, and the same 403 as any other
    forbidden target for everyone else, so accounts can't be probed.
    """

    acting_user = str(acting_user).strip() if acting_user is not None else ""

    if not acting_user:
        return requester

    if not requester or not requester.is_authenticated:
        raise PermissionDenied("Authentication is required to act as another user.")

    lookup = (
        {"id": int(acting_user)} if acting_user.isdigit() else {"username": acting_user}
    )

    if requester.is_superuser:
        target = get_object_or_404(User, **lookup)
    else:
        target = User.objects.filter(**lookup).first()

        if not target or not can_act_as(requester, target):
            raise PermissionDenied(
                "You can only act as yourself, your bots, or accounts you have "
                "been granted access to."
            )

    if target.id != requester.id:
        logger.info(
            "acting user: user %s acting as user %s on %s",
            requester.id,
            target.id,
            path,
        )

    return target


def get_acting_user(request: Request, data=None) -> User:
    """
    Validates `acting_user` from `data` (query params by default) and resolves
    the account the request acts as.
    """

    serializer = ActingUserSerializer(
        data=request.query_params if data is None else data
    )
    serializer.is_valid(raise_exception=True)

    return resolve_acting_user(
        request.user,
        serializer.validated_data.get("acting_user"),
        path=request.path,
    )
