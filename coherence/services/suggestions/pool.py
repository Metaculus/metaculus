"""
Eligibility rules and the candidate pool for AI link suggestions.

Pools and targets are Questions (not Posts) so group subquestions stay
individually addressable — every Question has a canonical .post link, so
post-level eligibility is filtered from the Question side.

The pool is built once per daily batch and held in memory; its hash is
recorded on each target's row for observability (the scheduler's staleness
check is purely time-based).
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

from django.db.models import F

from posts.models import Post
from questions.models import Question


# Mirrors ALLOWED_COHERENCE_LINK_QUESTION_TYPES in front_end/src/types/coherence.ts.
ALLOWED_COHERENCE_LINK_QUESTION_TYPES = [
    Question.QuestionType.BINARY,
    Question.QuestionType.NUMERIC,
    Question.QuestionType.DISCRETE,
    Question.QuestionType.DATE,
]


@dataclass
class TargetEntry:
    """One row in the popularity-ranked target list."""

    question_id: int
    forecasters_count: int
    # 100.0 = most popular eligible question, 0.0 = least popular.
    # Feeds the per-question staleness threshold in the scheduler.
    popularity_percentile: float


@dataclass
class Pool:
    candidate_ids: list[int]  # Question ids, most popular first; what the LLM sees
    pool_hash: str
    pool_size: int
    # All eligible questions (public AND private), most popular first.
    eligible_targets: list[TargetEntry]


def eligible_questions_qs():
    """
    Questions eligible to participate at all (as candidate or target):
    linkable type, unresolved, on an active non-conditional post.
    """
    return Question.objects.filter(
        type__in=ALLOWED_COHERENCE_LINK_QUESTION_TYPES,
        actual_resolve_time__isnull=True,
        post__in=Post.objects.filter_active().filter(conditional__isnull=True),
    )


def _candidate_question_ids() -> list[int]:
    """
    Public eligible questions — the LLM sees these titles. Most popular
    first, so if the pool ever outgrows the model's context window the
    truncation guard drops the least-forecasted questions.
    """
    return list(
        eligible_questions_qs()
        .filter(post__in=Post.objects.filter_public())
        .annotate(_pop=F("post__forecasters_count"))
        .order_by("-_pop", "id")
        .values_list("id", flat=True)
    )


def eligible_targets_by_popularity() -> list[TargetEntry]:
    """
    All eligible questions (public AND private) ranked by their post's
    forecaster count, with a percentile rank for the staleness formula.
    """
    rows = list(
        eligible_questions_qs()
        .annotate(_pop=F("post__forecasters_count"))
        .order_by("-_pop", "id")
        .values_list("id", "_pop")
    )
    n = len(rows)
    if n == 0:
        return []
    out: list[TargetEntry] = []
    for i, (qid, pop) in enumerate(rows):
        # i=0 (top) → 100; i=n-1 (bottom) → 0. A single-question pool → 100.
        percentile = 100.0 * (1.0 - i / max(n - 1, 1)) if n > 1 else 100.0
        out.append(
            TargetEntry(
                question_id=qid,
                forecasters_count=int(pop or 0),
                popularity_percentile=percentile,
            )
        )
    return out


def _hash_ids(ids: list[int]) -> str:
    h = hashlib.sha256()
    for i in sorted(ids):
        h.update(i.to_bytes(8, "big"))
    return h.hexdigest()[:16]


def build_pool() -> Pool:
    """Build a fresh pool snapshot from live data. ~hundreds of ms."""
    candidate_ids = _candidate_question_ids()
    return Pool(
        candidate_ids=candidate_ids,
        pool_hash=_hash_ids(candidate_ids),
        pool_size=len(candidate_ids),
        eligible_targets=eligible_targets_by_popularity(),
    )
