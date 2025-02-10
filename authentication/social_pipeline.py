from django.conf import settings
from rest_framework.exceptions import ValidationError


def check_signup_allowed(strategy, details, backend, user=None, *args, **kwargs):
    if not settings.PUBLIC_ALLOW_SIGNUP and not user:
        raise ValidationError("Signup is disabled")

    return {"user": user, **kwargs}
