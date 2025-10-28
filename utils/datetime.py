from datetime import timedelta


def timedelta_to_days(td: timedelta) -> float:
    """
    Convert a timedelta to a float representing total days (including fractions).

    Args:
        td (timedelta): The timedelta to convert.

    Returns:
        float: Total days as a float.
    """

    return td.total_seconds() / 86400.0
