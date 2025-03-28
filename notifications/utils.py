import re

from django.utils.html import strip_tags
from markdown import markdown

from comments.utils import USERNAME_PATTERN


def remove_markdown(text: str) -> str:
    return strip_tags(markdown(text))


def beautify_mentions(text: str) -> str:
    return re.sub(r"@\((.*?)\)", r"@\1", text)


def generate_email_comment_preview_text(
    text: str, username: str = None, max_chars: int = 80
) -> tuple[str, bool]:
    """
    Generate a preview of email comment text with mention highlighting.
    """

    placeholder = "..."
    text = remove_markdown(text)

    # Find all matches and check for the username mention
    matches = list(re.finditer(USERNAME_PATTERN, text))
    mention_match = None

    if username:
        mention_match = next(
            (
                match
                for match in matches
                if match.group(1).strip("()").lower() == username.lower()
            ),
            None,
        )

    if not mention_match:
        # No mention found, truncate text if necessary
        preview_text = text[:max_chars] + placeholder if len(text) > max_chars else text
        # Replace @(...) with @...
        return beautify_mentions(preview_text), False

    mention = f"@{mention_match.group(1)}"

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
    # Replace @(...) with @...
    preview = beautify_mentions(preview)

    return preview, True
