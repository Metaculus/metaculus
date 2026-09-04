"""
OpenAI transport for the paid suggestion methods: one completion request in,
a validated list of candidate ids out, with the call's USD cost attached.

The API reports token counts but not cost, so USD is computed locally from
the pricing constants below.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field

import openai
from django.conf import settings
from pydantic import ValidationError

from coherence.services.suggestions import parsing, prompts
from utils.openai import get_openai_client, pydantic_to_openai_json_schema

logger = logging.getLogger(__name__)

# One call can be a large share of an org's per-minute token allowance, so
# 429s between consecutive calls are normal and just need patience — the
# caller is a batch job with nowhere urgent to be. The SDK's own retry
# layer is disabled (see _create_with_retries): its hidden resubmissions
# of a huge request burn rate-limit budget before our loop sees the failure.
_RETRYABLE_ERRORS = (
    openai.RateLimitError,
    openai.InternalServerError,
    openai.APITimeoutError,
    openai.APIConnectionError,
)
_RETRY_WAITS_SECONDS = (60, 120, 240)


# ----- gpt-5.6-luna pricing (USD per 1M tokens, as of 2026-08) -------------
#
# Verify against https://openai.com/api/pricing/ before deploys and on a
# quarterly cadence — if pricing changes and these don't, recorded spend
# drifts from real billing.
PRICE_IN_PER_1M = 0.20
PRICE_CACHED_PER_1M = 0.02
PRICE_OUT_PER_1M = 1.20


@dataclass
class LlmResult:
    """Outcome of one voting call. `error` is set instead of raising."""

    candidate_ids: list[int] = field(default_factory=list)
    cost_usd: float = 0.0
    error: str | None = None


def request_votes(
    *,
    instructions: str,
    target: dict,
    candidates: list[dict],
    method_label: str,
) -> LlmResult:
    """
    Ask the model which candidates relate to the target, per `instructions`.
    Message layout keeps the shared pool prefix cacheable — see prompts.py.
    """
    if not candidates:
        return LlmResult(error="empty_pool")
    target_id = target["id"]

    client = get_openai_client(settings.OPENAI_API_KEY_QUESTION_LINKS)
    try:
        response = _create_with_retries(
            client,
            messages=[
                {"role": "system", "content": prompts.SYSTEM_PROMPT},
                {"role": "user", "content": prompts.candidate_pool_block(candidates)},
                {
                    "role": "user",
                    "content": prompts.request_block(instructions, target),
                },
            ],
            method_label=method_label,
            target_id=target_id,
        )
    except Exception as exc:
        logger.exception("OpenAI call failed for %s target=%s", method_label, target_id)
        return LlmResult(error=f"api_error: {exc.__class__.__name__}")

    cost = _cost_usd(response.usage)
    _log_usage(method_label, target_id, response.usage, cost)

    if not response.choices:
        return LlmResult(cost_usd=cost, error="no_choices")
    content = (response.choices[0].message.content or "").strip()
    valid_ids = {c["id"] for c in candidates}
    return LlmResult(
        candidate_ids=_parse_candidate_ids(content, valid_ids),
        cost_usd=cost,
    )


def _create_with_retries(client, *, messages, method_label, target_id):
    client = client.with_options(max_retries=0)
    for wait_seconds in (*_RETRY_WAITS_SECONDS, None):
        try:
            return client.chat.completions.create(
                model=prompts.MODEL_NAME,
                messages=messages,
                response_format=pydantic_to_openai_json_schema(
                    prompts.MethodResponse, name="coherence_link_suggestions"
                ),
                prompt_cache_key=prompts.PROMPT_CACHE_KEY,
                max_completion_tokens=prompts.MAX_OUTPUT_TOKENS,
            )
        except _RETRYABLE_ERRORS as exc:
            if wait_seconds is None:
                raise
            wait_seconds = max(wait_seconds, _suggested_wait(exc))
            logger.warning(
                "%s target=%s: %s, retrying in %ds",
                method_label,
                target_id,
                exc.__class__.__name__,
                wait_seconds,
            )
            time.sleep(wait_seconds)


def _suggested_wait(exc) -> int:
    """The server's retry-after hint, when it sent one."""
    try:
        return int(float(exc.response.headers.get("retry-after", 0))) + 1
    except (AttributeError, TypeError, ValueError):
        return 0


def _cost_usd(usage) -> float:
    """USD spent on this call, from token counts + the cached-input discount."""
    if usage is None:
        return 0.0
    prompt_tokens = getattr(usage, "prompt_tokens", 0) or 0
    completion_tokens = getattr(usage, "completion_tokens", 0) or 0
    fresh = max(0, prompt_tokens - _cached_tokens(usage))
    return (
        fresh * PRICE_IN_PER_1M / 1_000_000
        + _cached_tokens(usage) * PRICE_CACHED_PER_1M / 1_000_000
        + completion_tokens * PRICE_OUT_PER_1M / 1_000_000
    )


def _cached_tokens(usage) -> int:
    details = getattr(usage, "prompt_tokens_details", None) if usage else None
    return (getattr(details, "cached_tokens", 0) or 0) if details else 0


def _log_usage(method_label: str, target_id: int, usage, cost: float) -> None:
    """One line per call so cache hit rate is visible in production logs."""
    logger.info(
        "%s target=%s prompt_tokens=%s cached=%s completion=%s cost=$%.4f",
        method_label,
        target_id,
        getattr(usage, "prompt_tokens", 0) if usage else 0,
        _cached_tokens(usage),
        getattr(usage, "completion_tokens", 0) if usage else 0,
        cost,
    )


def _parse_candidate_ids(content: str, valid_ids: set[int]) -> list[int]:
    """
    Parse candidate ids from the structured response; fall back to the
    tolerant extractor for almost-JSON. Hallucinated and duplicate ids are
    dropped, response order is preserved.
    """
    try:
        response = prompts.MethodResponse.model_validate_json(content)
        parsed = [c.candidate_id for c in response.candidates]
    except ValidationError:
        try:
            data = parsing.extract_json(content)
        except ValueError:
            logger.warning("failed to parse LLM JSON: %s", content[:200])
            return []
        if isinstance(data, dict):
            data = data.get("candidates", [])
        parsed = []
        for item in data if isinstance(data, list) else []:
            cid = (
                item.get("candidate_id", item.get("id"))
                if isinstance(item, dict)
                else item
            )
            try:
                parsed.append(int(cid))
            except (TypeError, ValueError):
                continue

    seen: set[int] = set()
    out: list[int] = []
    for cid in parsed:
        if cid in valid_ids and cid not in seen:
            seen.add(cid)
            out.append(cid)
    return out
