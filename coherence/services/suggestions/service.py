"""
AI-suggested question links for the Add Question Link modal: which questions
are eligible, the pipeline that ranks them, and the row that caches the result.
README.md walks through the pipeline.
"""

import asyncio
from dataclasses import dataclass
from datetime import timedelta

from asgiref.sync import async_to_sync
from django.conf import settings
from django.utils import timezone
from pgvector.django import CosineDistance

from coherence.models import CoherenceLinkSuggestion
from coherence.services.suggestions import llm
from coherence.services.suggestions.prompts import CandidateGrade
from posts.models import Post
from questions.models import Question
from utils.llm import get_llm_client_async

# Mirrors ALLOWED_COHERENCE_LINK_QUESTION_TYPES in front_end/src/types/coherence.ts.
LINKABLE_TYPES = [
    Question.QuestionType.BINARY,
    Question.QuestionType.NUMERIC,
    Question.QuestionType.DISCRETE,
    Question.QuestionType.DATE,
]

# The question pool changes slowly: ~2% of it is less than a month old.
STALE_AFTER = timedelta(days=30)
DEGRADED_STALE_AFTER = timedelta(days=1)

SHORTLIST_NEAR = 30
SHORTLIST_FAR = 20
SIMILARITY_WEIGHT = 2.0

SHOW_FROM_GRADE = 3
TOP_UP_FROM_GRADE = 2
MAX_SHOWN = 12
MIN_SHOWN = 5

# Leaves room for the surrounding queries inside gunicorn's 25 s worker timeout.
DEADLINE_SECONDS = 18

# STRENGTH_TIERS in front_end/src/types/coherence.ts
STRENGTHS = {"a_bit": 1, "mid": 2, "a_lot": 5}


class SuggestionsUnavailable(Exception):
    pass


@dataclass
class Suggestion:
    question: Question
    # The link's configuration, as CoherenceLink stores it: whether the target
    # is question1 (the cause), direction (+1/-1) and strength.
    target_is_cause: bool
    direction: int
    strength: int


def linkable_questions():
    """Questions that can be part of a question link. Includes private ones."""
    return Question.objects.filter(
        type__in=LINKABLE_TYPES,
        actual_resolve_time__isnull=True,
        post__in=Post.objects.filter_active().filter(conditional__isnull=True),
    )


def public_linkable_questions():
    """The linkable questions anyone can see: the only ones ever suggested."""
    return linkable_questions().filter(post__in=Post.objects.filter_public())


def get_suggestions_for_question(target: Question) -> list[Suggestion]:
    """
    Suggestions to show for `target`, computing them if needed. The target may
    be private: callers must check that the user can view it.
    """
    if (
        not settings.QUESTION_LINK_SUGGESTIONS_ENABLED
        or not settings.OPENROUTER_API_KEY
    ):
        return []
    if not linkable_questions().filter(pk=target.pk).exists():
        return []

    row = CoherenceLinkSuggestion.objects.filter(target_question=target).first()
    if row is None or _is_stale(row):
        # A stale row still beats nothing when a refresh isn't possible.
        row = _refresh(target) or row
    return _shown(row.suggestions) if row else []


def _is_stale(row: CoherenceLinkSuggestion) -> bool:
    max_age = DEGRADED_STALE_AFTER if row.degraded else STALE_AFTER
    return timezone.now() - row.computed_at > max_age


def _refresh(target: Question) -> CoherenceLinkSuggestion | None:
    try:
        suggestions, degraded = _compute(target)
    except SuggestionsUnavailable as exc:
        llm.alert(
            "unavailable",
            "Question-link suggestions unavailable for question %s: %s",
            target.id,
            exc,
            exc_info=exc.__cause__,
        )
        return None

    row, _ = CoherenceLinkSuggestion.objects.update_or_create(
        target_question=target,
        defaults={
            "suggestions": suggestions,
            "computed_at": timezone.now(),
            "degraded": degraded,
        },
    )
    return row


def _compute(target: Question) -> tuple[list[dict], bool]:
    target_vector = (
        Post.objects.filter(pk=target.post_id)
        .values_list("embedding_vector", flat=True)
        .first()
    )
    candidates = (
        public_linkable_questions().exclude(pk=target.pk).select_related("group")
    )
    if target_vector is not None:
        candidates = candidates.annotate(
            distance=CosineDistance("post__embedding_vector", target_vector)
        )
    candidates = list(candidates)
    similarity = {
        c.id: 1 - c.distance if getattr(c, "distance", None) is not None else 0.0
        for c in candidates
    }

    try:
        return async_to_sync(_compute_async)(target, candidates, similarity)
    except TimeoutError as exc:
        raise SuggestionsUnavailable(f"took longer than {DEADLINE_SECONDS} s") from exc


async def _compute_async(
    target: Question, candidates: list[Question], similarity: dict[int, float]
) -> tuple[list[dict], bool]:
    async with get_llm_client_async() as client:
        return await asyncio.wait_for(
            _rank(client.with_options(max_retries=1), target, candidates, similarity),
            DEADLINE_SECONDS,
        )


async def _rank(client, target, candidates, similarity) -> tuple[list[dict], bool]:
    if not candidates:
        return [], False
    scores, scan_errors = await llm.scan(client, target, candidates)
    if scan_errors:
        llm.alert(
            "scan",
            "Question-link suggestions: %d decision requests failed; "
            "those candidates rank by similarity alone",
            len(scan_errors),
            exc_info=scan_errors[0],
        )

    def blend(c: Question) -> float:
        return scores.get(c.id, 0.0) + SIMILARITY_WEIGHT * similarity[c.id]

    near = sorted(candidates, key=blend, reverse=True)[:SHORTLIST_NEAR]
    near_ids = {c.id for c in near}
    far = sorted(
        (c for c in candidates if c.id not in near_ids),
        key=lambda c: (scores.get(c.id, 0.0), similarity[c.id]),
        reverse=True,
    )[:SHORTLIST_FAR]

    grades, models, rerank_errors = await llm.rerank(client, target, near + far)
    if not grades:
        error = rerank_errors[0] if rerank_errors else None
        raise SuggestionsUnavailable("the rerank returned no grades") from error

    blended = {c.id: blend(c) for c in near + far}
    ranked = sorted(grades.values(), key=lambda g: (-g.grade, -blended[g.id]))
    degraded = bool(scan_errors or rerank_errors) or models != {llm.RERANK_MODEL}
    return [_as_dict(g) for g in ranked if g.grade >= TOP_UP_FROM_GRADE], degraded


def _as_dict(grade: CandidateGrade) -> dict:
    return {
        "question_id": grade.id,
        "grade": grade.grade,
        "target_is_cause": grade.cause == "target",
        "direction": 1 if grade.sign == "positive" else -1,
        "strength": STRENGTHS[grade.strength],
    }


def _shown(stored: list[dict]) -> list[Suggestion]:
    # Candidates can close, resolve or go private after the row was computed.
    available = (
        public_linkable_questions()
        .filter(pk__in=[s["question_id"] for s in stored])
        .in_bulk()
    )
    ranked = [s for s in stored if s["question_id"] in available]
    shown = [s for s in ranked if s["grade"] >= SHOW_FROM_GRADE][:MAX_SHOWN]
    if len(shown) < MIN_SHOWN:
        top_up = [s for s in ranked if s["grade"] < SHOW_FROM_GRADE]
        shown += top_up[: MIN_SHOWN - len(shown)]
    return [
        Suggestion(
            question=available[s["question_id"]],
            target_is_cause=s["target_is_cause"],
            direction=s["direction"],
            strength=s["strength"],
        )
        for s in shown
    ]
