import re

from django.db.models import Q

from comments.models import Comment
from users.models import User


def comment_extract_user_mentions(comment: Comment) -> dict[str, User]:
    """
    Extracts mentioned users query
    """

    # Regex pattern to find all @<username> mentions
    pattern = r"@(\w+)"
    unique_mentions = {m.lower() for m in re.findall(pattern, comment.text)}

    if not unique_mentions:
        return {}

    # Build a case-insensitive query for each mention
    query = Q()
    for mention in unique_mentions:
        # Check static mentions
        if mention == "admin":
            query |= Q()

        query |= Q(username__iexact=mention)

    users = User.objects.filter(query)

    return {f"@{user.username}": user for user in users}
