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
        if exc.error_list:
            exc = DRFValidationError(exc.error_list)
        elif exc.messages:
            exc = DRFValidationError(exc.messages)

    if isinstance(exc, DRFValidationError):
        if isinstance(exc.detail, list) or (
            # If anon ListField serializer raised an error
            isinstance(exc.detail, dict)
            and all([isinstance(k, int) for k in exc.detail.keys()])
        ):
            exc.detail = {"non_field_errors": exc.detail}

    return exception_handler(exc, context)
