from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    A custom exceptions handler to standardize ValidationError behaviour.
    We want to ensure it never returns list of errors, but structured dict object
    """

    # Adapter for legacy django validation errors
    print(f"Error:\n{exc}")
    if isinstance(exc, DjangoValidationError):
        if exc.message_dict:
            exc = DRFValidationError(exc.message_dict)
        elif exc.messages:
            exc = DRFValidationError(exc.messages)

    if isinstance(exc, DRFValidationError):
        if isinstance(exc.detail, list):
            exc.detail = {"non_field_errors": exc.detail}

    return exception_handler(exc, context)
