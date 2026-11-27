"""
OpenRouter calls behind AI question-link suggestions: the decision-model scan
and the rerank (see docs/llm-usage.md).
"""

import asyncio
import logging
import math
import random
import re
from itertools import batched

import openai
from django.core.cache import cache
from openai import AsyncOpenAI

from coherence.services.suggestions import prompts
from questions.models import Question
from utils.llm import LLMFeature, llm_options

logger = logging.getLogger(__name__)

# OpenRouter's decisions endpoint is in alpha and lives outside /api/v1.
DECISIONS_URL = "https://openrouter.ai/api/alpha/decisions"
SCAN_MODEL = "openai/gpt-6-luna-decisions"
SCAN_CHUNK_SIZE = 200  # the most questions OpenRouter accepts per request
SCAN_TIMEOUT_SECONDS = 8  # requests usually take ~1 s

RERANK_MODEL = "openai/gpt-6.1-sol"
RERANK_FALLBACK_MODEL = "openai/gpt-6-luna"
RERANK_GROUP_SIZE = 10
RERANK_TIMEOUT_SECONDS = 12  # calls usually take 3-5 s on the fast tier
RERANK_MAX_TOKENS = 3000  # outputs are ~1k; keeps OpenRouter's in-flight hold small

_REFUSED_QUESTION = re.compile(r"refused to answer question \W*c(\d+)")


def alert(kind: str, message: str, *args, exc_info=None) -> None:
    """
    Log at ERROR, which reaches Sentry, at most once an hour per `kind`, and
    at WARNING otherwise, so an outage is noticed without flooding Sentry.
    """
    first = cache.add(f"question-link-suggestions:alert:{kind}", 1, timeout=3600)
    logger.log(
        logging.ERROR if first else logging.WARNING, message, *args, exc_info=exc_info
    )


async def scan(
    client: AsyncOpenAI, target: Question, candidates: list[Question]
) -> tuple[dict[int, float], list[BaseException]]:
    """Score in [0, 1] per candidate id, plus the errors of failed requests."""
    results = await asyncio.gather(
        *(
            _scan_chunk(client, target, chunk)
            for chunk in batched(candidates, SCAN_CHUNK_SIZE)
        ),
        return_exceptions=True,
    )
    scores: dict[int, float] = {}
    errors = []
    for result in results:
        if isinstance(result, BaseException):
            errors.append(result)
        else:
            scores.update(result)
    return scores, errors


async def _scan_chunk(
    client: AsyncOpenAI, target: Question, chunk: tuple[Question, ...]
) -> dict[int, float]:
    pending = {c.id: c for c in chunk}
    max_level = len(prompts.SCAN_LEVELS) - 1
    # client.post() takes a raw body, so llm_options' tag and routing go in it.
    options = llm_options(LLMFeature.QUESTION_LINKS)
    routing = {"user": options["user"], **options["extra_body"]}
    # OpenRouter fails the whole request when the model refuses one question,
    # naming it in the error: drop that question and retry the rest.
    for _ in range(3):
        if not pending:
            return {}
        try:
            response = await client.post(
                DECISIONS_URL,
                cast_to=object,
                body={
                    "model": SCAN_MODEL,
                    "state": prompts.scan_state(target),
                    "questions": {
                        f"c{c.id}": prompts.scan_question(c) for c in pending.values()
                    },
                    **routing,
                },
                options={"timeout": SCAN_TIMEOUT_SECONDS},
            )
        except openai.APIStatusError as exc:
            refused = _REFUSED_QUESTION.search(str(exc))
            if not refused or int(refused[1]) not in pending:
                raise
            del pending[int(refused[1])]
            continue
        answers = response.get("answers") or {}
        return {
            cid: answer["score"] / max_level
            for cid in pending
            if (answer := answers.get(f"c{cid}")) and answer.get("score") is not None
        }
    raise RuntimeError(f"decision model refused 3 questions for target {target.id}")


async def rerank(
    client: AsyncOpenAI, target: Question, shortlist: list[Question]
) -> tuple[dict[int, prompts.CandidateGrade], set[str], list[BaseException]]:
    """
    Grades per candidate id, the models that produced them, and the errors of
    calls that failed with both models.
    """
    n_groups = math.ceil(len(shortlist) / RERANK_GROUP_SIZE)
    # Round-robin, so every call sees both near and far candidates.
    groups = [shortlist[i::n_groups] for i in range(n_groups)]
    results = await asyncio.gather(
        *(_rerank_group(client, target, group) for group in groups),
        return_exceptions=True,
    )
    grades: dict[int, prompts.CandidateGrade] = {}
    models: set[str] = set()
    errors = []
    for result in results:
        if isinstance(result, BaseException):
            errors.append(result)
        else:
            group_grades, model = result
            grades.update(group_grades)
            models.add(model)
    return grades, models, errors


async def _rerank_group(
    client: AsyncOpenAI, target: Question, group: list[Question]
) -> tuple[dict[int, prompts.CandidateGrade], str]:
    # Shuffled so the shortlist's ranking doesn't leak into the grades;
    # seeded so recomputing a target is reproducible.
    shuffled = group[:]
    random.Random(target.id).shuffle(shuffled)
    messages = [
        {"role": "system", "content": prompts.RERANK_SYSTEM_PROMPT},
        {"role": "user", "content": prompts.rerank_user_message(target, shuffled)},
    ]
    try:
        return await _grade(client, RERANK_MODEL, messages, group), RERANK_MODEL
    except Exception as exc:
        alert(
            "rerank-model",
            "Question-link suggestions: %s failed, falling back to %s",
            RERANK_MODEL,
            RERANK_FALLBACK_MODEL,
            exc_info=exc,
        )
    return (
        await _grade(client, RERANK_FALLBACK_MODEL, messages, group),
        RERANK_FALLBACK_MODEL,
    )


async def _grade(
    client: AsyncOpenAI, model: str, messages: list[dict], group: list[Question]
) -> dict[int, prompts.CandidateGrade]:
    options = llm_options(LLMFeature.QUESTION_LINKS)
    # The user is waiting on this call; the fast tier roughly halves it.
    extra_body = {**options.pop("extra_body"), "service_tier": "fast"}
    response = await client.chat.completions.parse(
        model=model,
        messages=messages,
        response_format=prompts.RerankResponse,
        # The lowest effort gpt-6.1-sol supports; "none" is rejected.
        reasoning_effort="low",
        max_completion_tokens=RERANK_MAX_TOKENS,
        timeout=RERANK_TIMEOUT_SECONDS,
        extra_body=extra_body,
        **options,
    )
    parsed = response.choices[0].message.parsed if response.choices else None
    if parsed is None:
        raise ValueError(f"{model} returned no parsed grades")
    ids = {c.id for c in group}
    grades = {g.id: g for g in parsed.candidates if g.id in ids}
    if not grades:
        raise ValueError(f"{model} graded none of the {len(group)} candidates")
    return grades
