import re

from django.utils.html import strip_tags
from markdown import markdown

from comments.utils import USERNAME_PATTERN


def remove_markdown(md: str, keep_newlines: bool = False) -> str:
    html = markdown(md)

    if keep_newlines:
        html = re.sub(r"</p\s*>", "\n\n", html, flags=re.I)
        html = re.sub(r"<br\s*/?>", "\n", html, flags=re.I)

    return strip_tags(html)


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


def _normalise_whitespace_keep_newlines(text: str) -> str:
    """
    Compress internal whitespace but *leave* `\n` tokens untouched.
    """
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(lines).strip()


def generate_email_notebook_preview_text(
    text: str,
    max_words: int = 100,
) -> str:
    """
    Produce a preview of a Notebook/article body for e-mails.

    Parameters
    ----------
    text : str
        Raw markdown of the Notebook.
    max_words : int
        Number of *words* to keep (default 100).

    Returns
    -------
    (preview: str, truncated: bool)
    """

    source = remove_markdown(text).replace("\\", "")
    source = _normalise_whitespace_keep_newlines(source)

    # tokenize, *but* preserve newlines so paragraphs stay visible
    tokens = re.split(r"(\s+)", source)  # keeps whitespace tokens
    word_count = 0
    out_tokens = []

    for tok in tokens:
        if word_count >= max_words:
            break
        if tok.isspace():
            out_tokens.append(tok)
        else:
            out_tokens.append(tok)
            word_count += 1

    truncated = word_count < len([t for t in tokens if not t.isspace()])

    preview = "".join(out_tokens).rstrip()
    if truncated:
        preview += "..."

    return preview
