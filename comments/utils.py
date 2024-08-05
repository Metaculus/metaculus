import re

from django.db.models import Q

from users.models import User


def comment_text_extract_user_mentions(text: str) -> dict[str, User]:
    # Regex pattern to find all @<username> mentions
    pattern = r"@(\w+)"
    unique_mentions = {m.lower() for m in re.findall(pattern, text)}

    if not unique_mentions:
        return {}

    # Build a case-insensitive query for each mention
    query = Q()
    for mention in unique_mentions:
        query |= Q(username__iexact=mention)

    users = User.objects.filter(query)

    return {f"@{user.username}": user for user in users}
