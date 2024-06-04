from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    A custom exceptions handler to standardize ValidationError behaviour.
    We want to ensure it never returns list of errors, but structured dict object
    """

    if isinstance(exc, ValidationError):
        if isinstance(exc.detail, list):
            exc.detail = {"non_field_errors": exc.detail}

    return exception_handler(exc, context)
