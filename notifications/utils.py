import re

from django.utils.html import strip_tags
from markdown import markdown

from comments.utils import USERNAME_PATTERN


def remove_markdown(text: str) -> str:
    return strip_tags(markdown(text))


def generate_email_comment_preview_text(text: str, username: str) -> tuple[str, bool]:
    """
    Generate a preview of email comment text with mention highlighting.
    """

    placeholder = "..."
    max_chars = 80
    text = remove_markdown(text)

    # Replace all matches with @username format
    text = re.sub(USERNAME_PATTERN, r"@\1", text)

    # Find all matches and check for the username mention
    matches = list(re.finditer(USERNAME_PATTERN, text))
    mention = f"@{username}"
    mention_match = next(
        (match for match in matches if match.group(1) == username), None
    )

    if not mention_match:
        # No mention found, truncate text if necessary
        preview_text = text[:max_chars] + placeholder if len(text) > max_chars else text
        return preview_text, False

    # Mention found, create preview around the mention
    idx = mention_match.start()
    start = max(0, idx - max_chars // 2)
    end = min(len(text), idx + max_chars // 2 + len(mention))

    preview = text[start:end]
    if start > 0:
        preview = placeholder + preview
    if end < len(text):
        preview += placeholder

    # Highlight the mention in the preview
    preview = re.sub(re.escape(mention), f"<b>{mention}</b>", preview)

    return preview, True
