import re
from collections import defaultdict
from typing import Iterable

from django.db.models import Q, QuerySet

from comments.models import Comment
from users.models import User

# Regex pattern to find all @<username> mentions
USERNAME_PATTERN = r"@\(?(\w+)\)?"


def comment_extract_user_mentions(
    comment: Comment, group_mentions: bool = True
) -> tuple[QuerySet["User"], set[str]]:
    """
    Extracts mentioned users query
    """

    unique_mentions = {m.lower() for m in re.findall(USERNAME_PATTERN, comment.text)}

    if not unique_mentions:
        return User.objects.none(), {}

    # Build a case-insensitive query for each mention
    query = Q()
    for mention in unique_mentions:
        # Check static mentions
        if group_mentions:
            if mention == "admins":
                query |= Q(pk__in=comment.on_post.default_project.get_admins())
                continue

            if mention in ("moderators", "curators"):
                query |= Q(pk__in=comment.on_post.default_project.get_curators())
                continue

            if mention == "predictors":
                query |= Q(pk__in=comment.on_post.get_forecasters())
                continue

        # Fallback to username mention
        query |= Q(username__iexact=mention)

    return User.objects.filter(query), unique_mentions


def comments_extract_user_mentions_mapping(
    comments: Iterable[Comment],
) -> dict[str, list[User]]:
    """
    Generates optimized mentions extraction from comments list
    """

    qs = User.objects.none()
    mentions_map = {}

    for comment in comments:
        users, mentions = comment_extract_user_mentions(comment, group_mentions=False)
        qs |= users

        mentions_map[comment.id] = mentions

    # Building users map
    users_map = {u.username.lower(): u for u in qs}

    comments_mapping = defaultdict(list)
    for comment_id, mentions in mentions_map.items():
        for username in mentions:
            if user := users_map.get(username.lower()):
                comments_mapping[comment_id].append(user)

    return comments_mapping
