"""
Tolerant JSON extractor used as a fallback when structured outputs fail.

Lifted from the prototype (~/metaculus-linked-questions-preview/pipeline.py).
Handles prose around JSON, ```json fences, and truncated arrays via
bracket-matching. Structured-output mode should produce parseable JSON in the
common case; this is just defence in depth.
"""

from __future__ import annotations

import json
import re


def extract_json(text: str):
    """
    Return the largest valid JSON value found anywhere in `text`. Raises
    ValueError if nothing usable can be parsed.
    """
    if not text:
        raise ValueError("empty text")
    text = text.strip()

    candidates: list[str] = []
    candidates.extend(re.findall(r"```(?:json)?\s*(.*?)```", text, flags=re.DOTALL))
    candidates.append(text)
    for i, ch in enumerate(text):
        if ch in "[{":
            candidates.append(text[i:])

    best, best_len = None, -1
    for c in candidates:
        c = c.strip()
        m = re.search(r"[\[{]", c)
        if not m:
            continue
        c = c[m.start() :]
        value = _parse(c)
        if value is None:
            continue
        n = len(value) if isinstance(value, (list, dict)) else 1
        if n > best_len:
            best, best_len = value, n
    if best is None:
        raise ValueError(f"no JSON found: {text[:200]}")
    return best


def _parse(s: str):
    try:
        return json.loads(s)
    except Exception:
        if s.startswith("["):
            recovered = _truncated_array(s)
            if recovered is not None:
                return recovered
    # Shrink from the right looking for any valid prefix.
    for end in range(len(s), 0, -1):
        try:
            return json.loads(s[:end])
        except Exception:
            continue
    return None


def _truncated_array(s: str):
    """Recover the longest valid prefix of a `[...` array."""
    if not s.startswith("["):
        return None
    depth, i, last = 1, 1, None
    in_str, esc = False, False
    while i < len(s):
        ch = s[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch in "[{":
                depth += 1
            elif ch in "]}":
                depth -= 1
                if depth <= 1:
                    last = i + 1
                if depth == 0:
                    break
            elif ch == "," and depth == 1:
                last = i
        i += 1
    if last is None:
        return None
    try:
        return json.loads(s[:last].rstrip().rstrip(",") + "]")
    except Exception:
        return None
