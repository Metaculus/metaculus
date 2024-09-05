from django.contrib.auth.tokens import default_token_generator
from rest_framework.exceptions import ValidationError

from users.models import User
from utils.email import send_email_with_template
from utils.frontend import (
    build_frontend_account_activation_url,
    build_frontend_password_reset_url,
)


def send_activation_email(user: User):
    confirmation_token = default_token_generator.make_token(user)
    activation_link = build_frontend_account_activation_url(user.id, confirmation_token)

    send_email_with_template(
        user.email,
        "Metaculus Account Creation",
        "emails/activation_email.html",
        context={
            "email": user.email,
            "username": user.username,
            "activation_link": activation_link,
        },
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
    )


def check_and_activate_user(user_id: int, token: str):
    """
    Validates activation token and activates user
    """

    user = User.objects.filter(pk=user_id, is_active=False).first()

    if not user or not default_token_generator.check_token(user, token):
        raise ValidationError({"token": ["Activation Token is expired or invalid"]})

    user.is_active = True
    user.save()

    return user


def check_password_reset(user_id: User, token: str):
    user = User.objects.filter(pk=user_id, is_active=True).first()

    if not user or not default_token_generator.check_token(user, token):
        raise ValidationError({"token": ["Password Reset Token is expired or invalid"]})

    return user
