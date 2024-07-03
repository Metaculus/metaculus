from django.db.models import Q
from rest_framework.exceptions import ValidationError

from users.models import User


def get_users(
    search: str = None,
) -> User.objects:
    """
    Applies filtering on the User QuerySet
    """

    qs = User.objects.filter(is_active=True)

    # Search
    if search:
        qs = qs.filter(username__icontains=search)

    return qs


def get_users_by_usernames(usernames: list[str]) -> list[User]:
    if not usernames:
        return User.objects.none()

    queries = Q()
    for username in usernames:
        queries |= Q(username__iexact=username)

    users = User.objects.filter(queries).distinct()
    fetched_usernames = {u.username for u in users}

    for username in usernames:
        if username not in fetched_usernames:
            raise ValidationError(f"User {username} does not exist")

    return users
