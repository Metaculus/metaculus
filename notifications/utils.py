from django.utils.html import strip_tags
from markdown import markdown


def remove_markdown(text: str) -> str:
    return strip_tags(markdown(text))


def generate_email_comment_preview_text(text: str, username: str) -> tuple[str, bool]:
    placeholder = "..."
    max_chars = 80
    text = remove_markdown(text)
    mention = f"@{username}"
    idx = text.find(mention)

    if idx == -1:
        return (text[:max_chars] + placeholder if len(text) > 80 else text), False

    start = max(0, idx - int(max_chars / 2))
    end = min(len(text), idx + int(max_chars / 2) + len(mention))

    preview = text[start:end]
    if start > 0:
        preview = placeholder + preview
    if end < len(text):
        preview += placeholder

    # Replace with bold
    preview = preview.replace(mention, f"<b>{mention}</b>")

    return preview, True
