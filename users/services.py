from django.db.models import Q
from rest_framework.exceptions import ValidationError

from notifications.constants import MailingTags
from posts.services.subscriptions import (
    disable_global_cp_reminders,
    enable_global_cp_reminders,
)
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


def user_unsubscribe_tags(user: User, tags: list[str]) -> None:
    # Newly excluded tags
    to_disable = set(tags) - set(user.unsubscribed_mailing_tags)
    to_enable = set(user.unsubscribed_mailing_tags) - set(tags)

    # If user wants to disable CP Change reminders
    if MailingTags.FORECASTED_CP_CHANGE in to_disable:
        disable_global_cp_reminders(user)

    if MailingTags.FORECASTED_CP_CHANGE in to_enable:
        enable_global_cp_reminders(user)

    user.unsubscribed_mailing_tags = tags
