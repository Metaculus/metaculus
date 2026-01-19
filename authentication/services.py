import uuid

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.signing import TimestampSigner
from django.utils.crypto import get_random_string
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User
from utils.email import send_email_with_template
from utils.frontend import (
    build_frontend_account_activation_url,
    build_frontend_password_reset_url,
    build_frontend_account_signup_invitation_url,
    get_frontend_host,
)


def send_activation_email(user: User, redirect_url: str | None):
    confirmation_token = default_token_generator.make_token(user)
    activation_link = build_frontend_account_activation_url(
        user.id, confirmation_token, redirect_url
    )

    send_email_with_template(
        user.email,
        "Activate Your Metaculus Account",
        "emails/activation_email.html",
        context={
            "email": user.email,
            "username": user.username,
            "activation_link": activation_link,
            "redirect_url": redirect_url,
            "public_app_url": settings.PUBLIC_APP_URL,
        },
        from_email=settings.EMAIL_HOST_USER,
    )


def send_password_reset_email(user: User):
    confirmation_token = default_token_generator.make_token(user)
    reset_link = build_frontend_password_reset_url(user.id, confirmation_token)

    send_email_with_template(
        user.email,
        "Metaculus Password Reset Request",
        "emails/password_reset.html",
        context={
            "username": user.username,
            "reset_link": reset_link,
        },
        from_email=settings.EMAIL_HOST_USER,
    )


def check_and_activate_user(user_id: int, token: str):
    """
    Validates activation token and activates user
    """

    user = User.objects.filter(pk=user_id).first()

    if not user:
        raise ValidationError({"token": ["Invalid user"]})

    # Skip if user is already active
    if user.is_active:
        return user

    if not default_token_generator.check_token(user, token):
        raise ValidationError({"token": ["Activation Token is expired or invalid"]})

    if user.is_spam:
        raise ValidationError({"user": ["User is marked as spam"]})

    user.is_active = True
    user.save()

    return user


def check_password_reset(user_id: User, token: str):
    user = User.objects.filter(pk=user_id, is_active=True).first()

    if not user or not default_token_generator.check_token(user, token):
        raise ValidationError({"token": ["Password Reset Token is expired or invalid"]})

    return user


class SignupInviteService:
    def __init__(self):
        self.signer = TimestampSigner()

    def _generate_token(self, email: str) -> str:
        token = f"{email.lower()}:{get_random_string(20)}"

        return self.signer.sign(token)

    def verify_email(self, email: str, token: str):
        if not token:
            raise ValidationError("Invalid signup invitation token")

        token = self.signer.unsign(token, max_age=None)
        invitation_email, _ = token.split(":")

        if email.lower() != invitation_email.lower():
            raise ValidationError("Can't verify signup invitation")

        return email

    def send_email(self, invited_by: User, email: str):
        invite_token = self._generate_token(email)
        signup_link = build_frontend_account_signup_invitation_url(email, invite_token)

        send_email_with_template(
            email,
            "Metaculus Signup Invitation",
            "emails/signup_invite.html",
            context={
                "email": email,
                "signup_link": signup_link,
                "invited_by": invited_by.username,
                "app_name": get_frontend_host(),
            },
            from_email=settings.EMAIL_HOST_USER,
        )


def get_tokens_for_user(user):
    if not user.is_active:
        raise AuthenticationFailed("User is not active")

    refresh = RefreshToken.for_user(user)
    # Add a session identification to isolate multiple sessions of the same user
    refresh["session_id"] = str(uuid.uuid4())

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }
