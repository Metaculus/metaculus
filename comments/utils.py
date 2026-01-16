import re
from collections import defaultdict
from typing import Iterable

from django.db.models import Q, QuerySet
from rest_framework.exceptions import PermissionDenied

from comments.models import Comment
from posts.models import Post
from projects.permissions import ObjectPermission
from users.models import User

# Regex pattern to find all @<username> mentions
USERNAME_PATTERN = r"@(\([^)]+\)|\w[\w\-_.]+\w)"


def validate_predictors_mention(text: str, user: User, post: Post) -> None:
    """
    Validates that only curators and admins can mention @predictors.
    Raises PermissionDenied if a non-curator/admin tries to use @predictors.
    """
    if not text:
        return

    mentions = {
        m.strip("()").lower() for m in re.findall(USERNAME_PATTERN, text, re.UNICODE)
    }

    if "predictors" in mentions:
        # Check if user has curator or admin permission
        if user not in post.default_project.get_users_for_permission(
            ObjectPermission.CURATOR
        ):
            raise PermissionDenied("Only curators and admins can mention @predictors")


def comment_extract_user_mentions(
    comment: Comment, group_mentions: bool = True
) -> tuple[QuerySet["User"], set[str]]:
    """
    Extracts mentioned users query
    """

    unique_mentions = {
        m.strip("()").lower()
        for m in re.findall(USERNAME_PATTERN, comment.text, re.UNICODE)
    }

    if not unique_mentions:
        return User.objects.none(), set()

    # Build a case-insensitive query for each mention
    query = Q(pk__in=[])  # default to no users, rather than all
    for mention in unique_mentions:
        # Check static mentions
        if group_mentions:
            if mention == "admins":
                query |= Q(
                    pk__in=comment.on_post.default_project.get_users_for_permission(
                        ObjectPermission.ADMIN
                    )
                )
                continue

            if mention in ("moderators", "curators"):
                query |= Q(
                    pk__in=comment.on_post.default_project.get_users_for_permission(
                        ObjectPermission.CURATOR
                    )
                )
                continue

            if mention == "predictors":
                # only curators and admins can notify predictors
                if (
                    comment.author
                    in comment.on_post.default_project.get_users_for_permission(
                        ObjectPermission.CURATOR
                    )
                ):
                    query |= Q(
                        pk__in=User.objects.filter(
                            forecast__post=comment.on_post
                        ).distinct("pk")
                    )
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


def get_mention_for_user(user: User, unique_mentions: Iterable[str]) -> str:
    """
    Extracts the approximate mention label for a given user.
    This method is triggered when we know the user was mentioned in the comment body,
    but we don’t have visibility into which mention was used.
    While not ideal, this function attempts to guess the most likely and relevant mention type
    that triggered the notification.
    """

    username = user.username.lower()
    priority = [username, "predictors", "moderators", "curators", "admins"]

    for mention in priority:
        if mention in unique_mentions:
            return mention

    return username
