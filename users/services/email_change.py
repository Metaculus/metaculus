import logging
from datetime import datetime, timedelta
from typing import NamedTuple

from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.contrib.auth.password_validation import validate_password
from django.core import signing
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from social_django.models import UserSocialAuth

from authentication.jwt_session import revoke_all_user_tokens
from authentication.models import ApiKey
from users.models import User
from utils.email import send_account_email_with_template
from utils.frontend import (
    build_frontend_email_change_rollback_url,
    build_frontend_email_change_url,
)
from utils.tokens import ScopedTokenGenerator

logger = logging.getLogger(__name__)

CONFIRM_TOKEN_SALT = "users.email_change"
ROLLBACK_TOKEN_SALT = "users.email_change_rollback"


class EmailChangeTokenGenerator(ScopedTokenGenerator):
    key_salt = "users.EmailChangeTokenGenerator"

    @property
    def token_timeout(self) -> int:
        return settings.AUTH_EMAIL_CHANGE_TIMEOUT

    def _make_hash_value(self, user: User, timestamp: int) -> str:
        # No last_login: signing in on another device must not kill the link
        changed_at = user.email_changed_at.isoformat() if user.email_changed_at else ""
        return f"{user.pk}{user.password}{user.email}{changed_at}{timestamp}"


email_change_token_generator = EmailChangeTokenGenerator()


class EmailChangeWrongAccountError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self):
        super().__init__(
            detail={
                "detail": "This link is for a different account",
                "error_code": "WRONG_ACCOUNT",
            }
        )


class RollbackTarget(NamedTuple):
    user: User
    old_email: str
    new_email: str


def make_email_change_token(user: User, new_email: str) -> str:
    return signing.dumps(
        {
            "user_id": user.pk,
            "new_email": new_email,
            "check": email_change_token_generator.make_token(user),
        },
        salt=CONFIRM_TOKEN_SALT,
    )


def check_email_change_token(user: User, token: str) -> str:
    try:
        payload = signing.loads(
            token, salt=CONFIRM_TOKEN_SALT, max_age=settings.AUTH_EMAIL_CHANGE_TIMEOUT
        )
    except signing.BadSignature:
        raise ValidationError("Link is invalid or expired")

    if payload["user_id"] != user.pk:
        raise EmailChangeWrongAccountError()

    if not email_change_token_generator.check_token(user, payload["check"]):
        raise ValidationError("Link is invalid or expired")

    return payload["new_email"]


def make_rollback_token(user: User, old_email: str) -> str:
    return signing.dumps(
        {
            "user_id": user.pk,
            "old_email": old_email,
            "new_email": user.email,
            # Compared for equality with the DB value, so microseconds must survive
            "changed_at": user.email_changed_at.isoformat(),
        },
        salt=ROLLBACK_TOKEN_SALT,
    )


def load_rollback_target(token: str, for_update: bool = False) -> RollbackTarget:
    try:
        payload = signing.loads(
            token,
            salt=ROLLBACK_TOKEN_SALT,
            max_age=settings.AUTH_EMAIL_CHANGE_ROLLBACK_TIMEOUT,
        )
    except signing.BadSignature:
        raise ValidationError("Link is invalid or expired")

    users = User.objects.select_for_update() if for_update else User.objects
    user = users.filter(pk=payload["user_id"]).first()

    if (
        not user
        or user.email_changed_at != datetime.fromisoformat(payload["changed_at"])
        or user.email.lower() != payload["new_email"].lower()
    ):
        raise ValidationError("Link is invalid or expired")

    if not user.is_active:
        raise ValidationError(
            f"This account is deactivated. Contact {settings.EMAIL_SUPPORT}."
        )

    return RollbackTarget(user, payload["old_email"], payload["new_email"])


def _get_activatable_holders(
    user: User, email: str, for_update: bool = False
) -> list[User]:
    """Other accounts holding the address; raises if any of them was ever activated."""
    users = User.objects.select_for_update() if for_update else User.objects
    holders = list(users.filter(email__iexact=email).exclude(pk=user.pk))

    blocking_ids = [holder.pk for holder in holders if not holder.check_can_activate()]
    if blocking_ids:
        logger.info(
            "email_change address in use: user_id=%s holder_ids=%s",
            user.pk,
            blocking_ids,
        )
        raise ValidationError("The email is already in use")

    return holders


def request_email_change(user: User, password: str, new_email: str) -> None:
    if not user.check_password(password):
        raise ValidationError({"password": "Invalid password"})

    if new_email.lower() == user.email.lower():
        raise ValidationError({"email": "This is already your email address"})

    if user.email_changed_at:
        unlocks_at = user.email_changed_at + timedelta(
            seconds=settings.AUTH_EMAIL_CHANGE_ROLLBACK_TIMEOUT
        )
        if timezone.now() < unlocks_at:
            raise ValidationError(
                "You can change your email again after "
                f"{unlocks_at:%B} {unlocks_at.day}, {unlocks_at.year} (UTC)."
            )

    _get_activatable_holders(user, new_email)

    send_email_change_confirmation_email(
        new_email, make_email_change_token(user, new_email)
    )


def send_email_change_confirmation_email(new_email: str, token: str) -> None:
    send_account_email_with_template(
        new_email,
        "Confirm your new Metaculus email",
        "emails/email_change_confirm.html",
        context={"confirm_link": build_frontend_email_change_url(token)},
    )


def _claim_email(user: User, email: str) -> None:
    for holder in _get_activatable_holders(user, email, for_update=True):
        holder.email = ""
        holder.save(update_fields=["email"])


def check_email_change(user: User, token: str) -> str:
    new_email = check_email_change_token(user, token)
    _get_activatable_holders(user, new_email)

    return new_email


@transaction.atomic
def confirm_email_change(user: User, token: str) -> User:
    user = User.objects.select_for_update().get(pk=user.pk)
    new_email = check_email_change_token(user, token)
    _claim_email(user, new_email)

    old_email = user.email
    user.email = new_email
    user.email_changed_at = timezone.now()
    user.save(update_fields=["email", "email_changed_at"])
    revoke_all_user_tokens(user)

    rollback_link = build_frontend_email_change_rollback_url(
        make_rollback_token(user, old_email)
    )
    transaction.on_commit(
        lambda: send_email_change_notice_email(user, old_email, rollback_link),
        robust=True,
    )

    return user


def send_email_change_notice_email(
    user: User, old_email: str, rollback_link: str
) -> None:
    send_account_email_with_template(
        old_email,
        "Your Metaculus email was changed",
        "emails/email_change_notice.html",
        context={
            "username": user.username,
            "new_email": user.email,
            "rollback_link": rollback_link,
        },
    )


def check_email_change_rollback(token: str) -> RollbackTarget:
    target = load_rollback_target(token)
    _get_activatable_holders(target.user, target.old_email)

    return target


@transaction.atomic
def rollback_email_change(token: str, password: str) -> User:
    user, old_email, new_email = load_rollback_target(token, for_update=True)
    _claim_email(user, old_email)

    user.email = old_email
    validate_password(password, user=user)
    if check_password(password, user.password):
        raise ValidationError(
            {"password": ["Choose a password different from your current one"]}
        )

    changed_at = user.email_changed_at
    user.set_password(password)
    user.email_changed_at = None
    user.save(update_fields=["email", "password", "email_changed_at"])

    revoke_all_user_tokens(user)
    ApiKey.objects.filter(user=user).delete()
    # associate_by_email attaches a provider identity matching the new address
    UserSocialAuth.objects.filter(user=user, created__gte=changed_at).delete()

    transaction.on_commit(
        lambda: send_email_change_rolled_back_email(user, old_email, new_email),
        robust=True,
    )

    return user


def send_email_change_rolled_back_email(
    user: User, old_email: str, new_email: str
) -> None:
    send_account_email_with_template(
        new_email,
        "Your Metaculus email change was undone",
        "emails/email_change_rolled_back.html",
        context={
            "username": user.username,
            "old_email": old_email,
            "new_email": new_email,
            "support_email": settings.EMAIL_SUPPORT,
        },
    )
