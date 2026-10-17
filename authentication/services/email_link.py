import logging

from django.conf import settings
from rest_framework.exceptions import ValidationError

from users.models import User
from utils.email import send_account_email_with_template
from utils.frontend import build_frontend_auth_email_url
from utils.tokens import ScopedTokenGenerator

logger = logging.getLogger(__name__)


class EmailLinkTokenGenerator(ScopedTokenGenerator):
    """
    Token generator for email-link auth (gated CTA flow). Inherits state-hash
    invalidation - any sign-in (last_login change) invalidates all previously
    emailed links.
    """

    key_salt = "authentication.EmailLinkTokenGenerator"

    @property
    def token_timeout(self) -> int:
        return settings.AUTH_EMAIL_LINK_TIMEOUT


email_link_token_generator = EmailLinkTokenGenerator()


def verify_email_link_auth(user_id: int, token: str) -> User:
    """
    Validates an email-link token, activates the user when applicable and
    returns them. One generic error for every failure mode (anti-enumeration).
    """

    user = User.objects.select_for_update().filter(pk=user_id).first()

    if (
        not user
        or not email_link_token_generator.check_token(user, token)
        or user.is_deactivated
    ):
        logger.info(f"email_link verify rejected: user_id={user_id}")
        raise ValidationError({"token": ["Link is invalid or expired"]})

    if user.check_can_activate():
        user.is_active = True
        user.save(update_fields=["is_active"])

    return user


def send_email_link_auth_email(user: User, redirect_url: str | None) -> None:
    token = email_link_token_generator.make_token(user)
    link = build_frontend_auth_email_url(user.id, token, redirect_url)

    is_existing_user = user.is_active
    subject = "Your sign-in link" if is_existing_user else "Confirm your email"
    # Header differs from the subject on purpose: the subject is what scans well
    # in an inbox list, the header is what reads well above the CTA.
    header = "Sign in to Metaculus" if is_existing_user else "Welcome to Metaculus"

    send_account_email_with_template(
        user.email,
        subject,
        "emails/email_link_auth.html",
        context={
            "email": user.email,
            "username": user.username,
            "email_subject_display": header,
            "is_existing_user": is_existing_user,
            "email_link": link,
            "public_app_url": settings.PUBLIC_APP_URL,
        },
    )
