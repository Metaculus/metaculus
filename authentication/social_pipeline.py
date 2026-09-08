from django.conf import settings
from django.contrib.auth import user_logged_in
from rest_framework.exceptions import ValidationError

from users.models import User
from users.services.username_generator import generate_username

# Marks a signup that came through the email-capture drawer rather than the
# ordinary signup modal; sent by the frontend on the code-exchange request.
EMAIL_CAPTURE_SOURCE = "email_capture"


def associate_by_email(backend, details, user=None, *args, **kwargs):
    """
    Replaces social_core's associate_by_email, which only matches active users -
    so a provider login whose email belonged to a pending signup created a
    duplicate account instead of matching it.

    Mirrors the email-link flow: a never-activated account is claimed and
    activated, while deactivated and spam accounts are refused.
    """
    if user:
        return None

    email = details.get("email")
    if not email:
        return None

    existing = User.objects.filter(email__iexact=email).last()

    if not existing:
        return None

    if not existing.is_active:
        if not existing.check_can_activate():
            raise ValidationError("This account is no longer available")

        existing.is_active = True
        existing.save(update_fields=["is_active"])

    return {"user": existing, "is_new": False}


def create_user(strategy, details, backend, user=None, *args, **kwargs):
    """
    Replaces social_core's create_user step so we own social account creation.

    Also gates signup: a new account is only created when signups are enabled.
    The username is generated, never taken from the provider profile (which
    would publish a fragment of the email address), so accounts are created with
    username_set_at=None (no human-set stamp) - the manager would otherwise
    default it to now.
    """
    if user:
        return {"is_new": False}

    if not settings.PUBLIC_ALLOW_SIGNUP:
        raise ValidationError("Signup is disabled")

    # Signing up from the email-capture drawer means arriving as a reader, so
    # start in the consumer view rather than switching layouts on arrival. The
    # ordinary signup modal sends no source and keeps the forecaster default.
    from_capture = strategy.request_data().get("signup_source") == EMAIL_CAPTURE_SOURCE

    user = User.objects.create_user(
        username=generate_username(),
        email=kwargs.get("email", details.get("email")),
        username_set_at=None,
        interface_type=(
            User.InterfaceType.CONSUMER_VIEW
            if from_capture
            else User.InterfaceType.FORECASTER_VIEW
        ),
    )

    return {
        "is_new": True,
        "user": user,
    }


def send_user_logged_in(strategy, user=None, *args, **kwargs):
    """
    Sends the user_logged_in signal when a user logs in via social auth.
    """
    if user:
        user_logged_in.send(sender=user.__class__, request=strategy.request, user=user)

    return {"user": user, **kwargs}
