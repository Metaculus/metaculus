"""
Read path for the Add Question Link modal.

One lookup on the target's CoherenceLinkSuggestion row, then permission- and
eligibility-filter the candidates. Score = number of active methods that
voted; method names not in Method.ALL (retired methods) are ignored.
"""

from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings

from coherence.models import CoherenceLinkSuggestion
from coherence.services.suggestions.pool import ALLOWED_COHERENCE_LINK_QUESTION_TYPES
from posts.models import Post
from questions.models import Question
from users.models import User


@dataclass
class Suggestion:
    question: Question
    score: int
    methods: list[str]


def get_suggestions_for_question(
    target_question: Question,
    user: User | None,
    limit: int = 20,
) -> list[Suggestion]:
    if not settings.SUGGESTIONS_AI_ENABLED:
        return []

    votes = (
        CoherenceLinkSuggestion.objects.filter(target_question_id=target_question.id)
        .values_list("methods_by_candidate", flat=True)
        .first()
    )
    if not votes:
        return []

    active = CoherenceLinkSuggestion.Method.ALL
    methods_by_candidate: dict[int, list[str]] = {}
    for cid_str, names in votes.items():
        kept = sorted(m for m in names if m in active)
        if kept:
            methods_by_candidate[int(cid_str)] = kept
    if not methods_by_candidate:
        return []

    visible = {q.id: q for q in _filter_visible(list(methods_by_candidate), user)}
    suggestions = [
        Suggestion(question=visible[cid], score=len(names), methods=names)
        for cid, names in methods_by_candidate.items()
        if cid in visible
    ]
    suggestions.sort(key=lambda s: (-s.score, s.question.id))
    return suggestions[:limit]


def _filter_visible(candidate_ids: list[int], user: User | None) -> list[Question]:
    """Candidates the user may see, still active and of a linkable type."""
    if not candidate_ids:
        return []
    visible_posts = Post.objects.filter_permission(user=user).filter_active()
    return list(
        Question.objects.filter(
            id__in=candidate_ids,
            type__in=ALLOWED_COHERENCE_LINK_QUESTION_TYPES,
            actual_resolve_time__isnull=True,
            post__in=visible_posts,
        ).select_related("post")
    )
