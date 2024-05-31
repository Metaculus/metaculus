from django.contrib.auth.tokens import default_token_generator
from rest_framework.exceptions import ValidationError

from users.models import User
from utils.email import send_email_with_template
from utils.frontend import build_frontend_account_activation_url


def generate_user_activation_link(user: User):
    """
    Generates the confirmation link for account activation
    """

    confirmation_token = default_token_generator.make_token(user)

    return build_frontend_account_activation_url(user.id, confirmation_token)


def send_activation_email(user: User):
    activation_link = generate_user_activation_link(user)

    # TODO: send email, so printing link for now
    print(activation_link)

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


def check_and_activate_user(user: User, token: str):
    """
    Validates activation token and activates user
    """

    if not default_token_generator.check_token(user, token):
        raise ValidationError("Invalid activation token")

    user.is_active = True
    user.save()
