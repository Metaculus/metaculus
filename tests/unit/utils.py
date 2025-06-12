from datetime import datetime

from django.utils.timezone import make_aware


def datetime_aware(*args, **kwargs):
    """
    Generates timezone-aware datetime object
    """

    return make_aware(datetime(*args, **kwargs))
