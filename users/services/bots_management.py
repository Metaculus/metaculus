import logging

from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied, ValidationError

from users.constants import ApiForecastingAccess, DEFAULT_MAX_BOTS
from users.models import User

logger = logging.getLogger(__name__)


def get_user_bots(user: User):
    return User.objects.filter(bot_owner=user).order_by("-is_primary_bot", "created_at")


def get_max_bots(user: User) -> int | None:
    """
    Number of bots the user may own. None means unlimited.

    Overridden per user via the `max_bots` key of User.metadata, which lets
    admins lift the limit without a deploy.
    """

    if user.is_superuser:
        return None

    limit = (user.metadata or {}).get("max_bots")

    if isinstance(limit, bool) or not isinstance(limit, int) or limit < 0:
        return DEFAULT_MAX_BOTS

    return limit


def create_bot(*, bot_owner: User, username: str, **kwargs) -> User:
    user_bots = list(get_user_bots(bot_owner))
    max_bots = get_max_bots(bot_owner)

    if max_bots is not None and len(user_bots) >= max_bots:
        raise ValidationError(f"User can have only {max_bots} bots")

    is_primary_bot = not any(b.is_primary_bot for b in user_bots)

    bot = User.objects.create_user(
        username=username,
        email="",
        is_active=True,
        is_bot=True,
        is_primary_bot=is_primary_bot,
        bot_owner=bot_owner,
        language=bot_owner.language,
        app_theme=bot_owner.app_theme,
        newsletter_optin=False,
        api_forecasting_access=ApiForecastingAccess.ENABLED,
        **kwargs,
    )

    return bot


def is_metac_bot(user: User) -> bool:
    bot_details = (user.metadata or {}).get("bot_details")

    return (
        user.is_bot
        and isinstance(bot_details, dict)
        and bot_details.get("metac_bot") is True
    )


def can_act_as_metac_bots(user: User) -> bool:
    """
    Granted via the `can_act_as_metac_bots` key of User.metadata, which lets
    admins give a non-superuser service account access to the metac bots.
    """

    return (user.metadata or {}).get("can_act_as_metac_bots") is True


def resolve_staff_override_target(
    requester: User,
    *,
    user_id: int | None = None,
    username: str | None = None,
    path: str = "",
) -> User:
    """
    Resolves the account a request with `is_staff_override` acts as.

    Superusers may act as any account. Accounts with `can_act_as_metac_bots`
    may act only as active metac bots, and get the same 403 for every other
    target, including ones that don't exist, so they can't probe for accounts.
    """

    if not requester or not requester.is_authenticated:
        raise PermissionDenied("Authentication is required to use is_staff_override.")

    lookup = {"id": user_id} if user_id else {"username": username}

    if requester.is_superuser:
        target = get_object_or_404(User, **lookup)
    elif can_act_as_metac_bots(requester):
        target = User.objects.filter(is_active=True, **lookup).first()

        if not target or not is_metac_bot(target):
            raise PermissionDenied("This account can only act as active metac bots.")
    else:
        raise PermissionDenied(
            "Only superusers and metac bot service accounts can use "
            "the is_staff_override flag."
        )

    logger.info(
        "is_staff_override: user %s acting as user %s on %s",
        requester.id,
        target.id,
        path,
    )

    return target
