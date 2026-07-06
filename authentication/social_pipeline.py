from django.conf import settings
from django.contrib.auth import user_logged_in
from rest_framework.exceptions import ValidationError


def check_signup_allowed(strategy, details, backend, user=None, *args, **kwargs):
    if not settings.PUBLIC_ALLOW_SIGNUP and not user:
        raise ValidationError("Signup is disabled")

    return {"user": user, **kwargs}


def send_user_logged_in(strategy, user=None, *args, **kwargs):
    """
    Sends the user_logged_in signal when a user logs in via social auth.
    """
    if user:
        user_logged_in.send(sender=user.__class__, request=strategy.request, user=user)

    return {"user": user, **kwargs}
