"""
Prompts and response schemas for the LLM methods.

Message layout (so OpenAI prefix caching is shared across methods):

    system  : one-line role                  (shared by all methods)
    user 1  : candidate-pool block           (shared; ~10–25k tokens)
    user 2  : method instructions + target   (varies per method/target)

Prefix caching matches from token 0, so everything that varies must come
last. With this layout the second and third method calls for a target ride
the pool prefix the first call cached, and so do all later targets in the
same batch. `PROMPT_CACHE_KEY` keeps our calls routed to the same cache
shard.
"""

from __future__ import annotations

import functools

import tiktoken
from pydantic import BaseModel, Field


# ----- model + context limits ----------------------------------------------
#
# Set here rather than in settings — these are owned by the feature, not by
# whoever runs ops.

# Chosen for its input window (922k tokens as of 2026-08): the whole
# production question pool fits in one request, so no candidates get
# truncated away — surfacing links to obscure questions is part of the
# feature's point.
MODEL_NAME = "gpt-5.6-luna"
PROMPT_CACHE_KEY = "question-link-suggestions"
# Per-request input allowance: fits a ~22k-question pool while keeping a
# wide margin under the model's hard limit, since very large requests are
# where API reliability degrades first.
INPUT_TOKEN_BUDGET = 700_000
# The JSON output is small; this guards a runaway response.
MAX_OUTPUT_TOKENS = 8_000
# Reserved for the per-method instruction block (largest is ~250 tokens).
INSTRUCTIONS_TOKEN_ALLOWANCE = 600


SYSTEM_PROMPT = (
    "You are an analyst finding influence links between forecasting "
    "questions on Metaculus."
)


# ----- response schema (shared by all three LLM methods) ------------------


class _Candidate(BaseModel):
    candidate_id: int = Field(..., description="The id of a candidate question.")


class MethodResponse(BaseModel):
    candidates: list[_Candidate] = Field(
        default_factory=list,
        description="Questions whose resolution would meaningfully shift the forecast on the target.",
    )


# ----- per-method instructions ---------------------------------------------

INSTRUCTIONS_LLM_BROAD = """\
You are surfacing INFLUENCE links for a forecaster's curation queue.

A forecaster is researching the TARGET question below and wants to discover
candidate questions whose resolution would shift their forecast on the target —
including via shared mechanisms, common drivers (same domain, same time period,
same actors), upstream or downstream effects, or strong correlations through
shared causes.

Lean toward HIGH RECALL: the user will manually filter; missing a real link is
worse than including a borderline one. Aim for ~10-25 links per target unless
the pool clearly has fewer related questions.

Reject only:
- Trivial logical equivalence (the same question reworded).
- Completely unrelated questions (no plausible mechanism, shared cause, or domain).
"""


INSTRUCTIONS_LLM_STRICT = """\
You are identifying genuine CAUSAL or INFLUENCE relationships.

Return only those candidates whose resolution would meaningfully shift the
forecast on the TARGET question below (or vice versa) — beyond what mere
correlation through a shared cause would imply.

Reject:
- Trivial / logical equivalence.
- Pure correlation through a shared driver.
- Speculative chains.
- Ambiguous or weak relationships.

It is fine and often correct to return an empty list.
"""


# llm_similar_only reuses the strict instructions — the difference is that
# its pool has been pre-filtered to the embedding-nearest shortlist.
INSTRUCTIONS_LLM_SIMILAR_ONLY = INSTRUCTIONS_LLM_STRICT


# ----- block builders ------------------------------------------------------

_POOL_HEADER = "The CANDIDATE pool follows. Each line is `id|type|title`.\n"


def _pool_line(candidate: dict) -> str:
    title = (candidate.get("title") or "").replace("\n", " ").replace("|", "/")[:300]
    return f"{candidate['id']}|{candidate.get('type', '')}|{title}"


def candidate_pool_block(candidates: list[dict]) -> str:
    """One line per candidate: `id|type|title`. Order matters for caching."""
    return "\n".join([_POOL_HEADER, *(_pool_line(c) for c in candidates)])


def request_block(instructions: str, target: dict) -> str:
    """The varying tail of the prompt: method instructions + target."""
    parts = [
        instructions,
        "TARGET question:",
        f"  id: {target['id']}",
        f"  type: {target.get('type', '')}",
        f"  title: {target['title']}",
    ]
    rc = (target.get("resolution_criteria") or "").strip()
    if rc:
        parts.append(f"  resolution_criteria: {rc[:1500]}")
    descr = (target.get("description") or "").strip()
    if descr:
        parts.append(f"  description: {descr[:600]}")
    parts.append(
        '\nReturn ONLY a JSON object with a single field "candidates", a list '
        'of {"candidate_id": <int>} objects. Pick candidates strictly from '
        "the candidate pool above; never pick the TARGET question itself."
    )
    return "\n".join(parts)


# ----- context-window guard -----------------------------------------------


@functools.cache
def _encoding():
    # gpt-4o/gpt-5 family encoding. Exact counting matters here: the cheap
    # chars/4 heuristic undercounts real Metaculus titles by ~14%, enough to
    # admit over-limit prompts near the boundary. Loaded lazily because
    # tiktoken fetches the encoding file over the network on first use.
    return tiktoken.get_encoding("o200k_base")


def count_tokens(text: str) -> int:
    return len(_encoding().encode(text))


def fit_pool_to_context(
    candidates: list[dict], target: dict
) -> tuple[list[dict], bool]:
    """
    Drop candidates from the end of the list until the projected prompt fits
    in INPUT_TOKEN_BUDGET. Returns (kept_candidates, was_truncated).

    Called once per target (in the pipeline) so every method sees the same
    pool — for fairness, and to keep the cached prefix identical across the
    method calls. The pool arrives most-popular-first (see pool.py), so
    truncation drops the least-forecasted questions.
    """
    fixed_tokens = (
        count_tokens(SYSTEM_PROMPT)
        + INSTRUCTIONS_TOKEN_ALLOWANCE
        + count_tokens(request_block("", target))
    )
    budget = INPUT_TOKEN_BUDGET - fixed_tokens
    if budget <= 0:
        return [], True

    # Per-line counts (tokenised with the joining newline) prefix-sum to the
    # whole block, so the cut point is exact in one pass.
    total = count_tokens(_POOL_HEADER)
    line_tokens = _encoding().encode_batch([f"\n{_pool_line(c)}" for c in candidates])
    for i, tokens in enumerate(line_tokens):
        total += len(tokens)
        if total > budget:
            return candidates[:i], True
    return candidates, False
