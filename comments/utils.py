import re

from django.db.models import Q, QuerySet

from comments.models import Comment
from users.models import User

# Regex pattern to find all @<username> mentions
USERNAME_PATTERN = r"@\(?(\w+)\)?"


def comment_extract_user_mentions(comment: Comment) -> QuerySet["User"]:
    """
    Extracts mentioned users query
    """

    unique_mentions = {m.lower() for m in re.findall(USERNAME_PATTERN, comment.text)}

    if not unique_mentions:
        return User.objects.none()

    # Build a case-insensitive query for each mention
    query = Q()
    for mention in unique_mentions:
        # Check static mentions
        if mention == "admins":
            query |= Q(pk__in=comment.on_post.default_project.get_admins())
        elif mention in ("moderators", "curators"):
            query |= Q(pk__in=comment.on_post.default_project.get_curators())
        elif mention in "predictors":
            query |= Q(pk__in=comment.on_post.get_forecasters())
        else:
            # Fallback to username mention
            query |= Q(username__iexact=mention)

    return User.objects.filter(query)
