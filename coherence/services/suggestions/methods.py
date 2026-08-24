"""
The five voting methods behind AI link suggestions. A candidate's score is
simply how many methods voted for it.

Paid methods (one LLM call each; run by the scheduler on stale targets):
    llm_broad         full candidate pool, high-recall instructions
    llm_strict        full candidate pool, genuine-causal-influence only
    llm_similar_only  strict instructions over an embedding shortlist

Free methods (cheap queries; refreshed daily for every eligible target):
    similar           candidate appears in the Similar Questions list
    community_link    an AggregateCoherenceLink already exists for the pair

Paid methods share the signature (target, candidates) -> LlmResult. Free
methods return plain id lists — they answer from live data and don't share
the LLM plumbing. Storage for both lives in pipeline.py.
"""

from __future__ import annotations

import logging

from django.db.models import Q
from pgvector.django import CosineDistance

from coherence.models import AggregateCoherenceLink, CoherenceLinkSuggestion
from coherence.services.suggestions import prompts
from coherence.services.suggestions.llm import LlmResult, request_votes
from posts.services.feed import get_similar_posts
from questions.models import Question

logger = logging.getLogger(__name__)

Method = CoherenceLinkSuggestion.Method

# Shortlist size for llm_similar_only's embedding pre-filter — its own
# pgvector query, so the strict prompt gets a larger set to judge than the
# Similar Questions cache offers.
LLM_SIMILAR_ONLY_SHORTLIST = 100

# Cap on `similar` votes, enforced on our side so a change inside
# get_similar_posts can't silently inflate them.
SIMILAR_TOP_K = 8


# ----- paid methods ---------------------------------------------------------


def llm_broad(target: dict, candidates: list[dict]) -> LlmResult:
    return request_votes(
        instructions=prompts.INSTRUCTIONS_LLM_BROAD,
        target=target,
        candidates=candidates,
        method_label=Method.LLM_BROAD,
    )


def llm_strict(target: dict, candidates: list[dict]) -> LlmResult:
    return request_votes(
        instructions=prompts.INSTRUCTIONS_LLM_STRICT,
        target=target,
        candidates=candidates,
        method_label=Method.LLM_STRICT,
    )


def llm_similar_only(target: dict, candidates: list[dict]) -> LlmResult:
    """Strict instructions over the embedding-nearest slice of the pool."""
    target_q = Question.objects.filter(id=target["id"]).select_related("post").first()
    if target_q is None or target_q.post is None:
        return LlmResult(error="target_not_found")
    target_vector = target_q.post.embedding_vector
    if target_vector is None:
        return LlmResult(error="target_no_embedding")

    shortlist_ids = list(
        Question.objects.filter(
            id__in=[c["id"] for c in candidates],
            post__embedding_vector__isnull=False,
        )
        .exclude(id=target["id"])  # never shortlist the target itself
        .annotate(distance=CosineDistance("post__embedding_vector", target_vector))
        .order_by("distance")
        .values_list("id", flat=True)[:LLM_SIMILAR_ONLY_SHORTLIST]
    )
    if not shortlist_ids:
        return LlmResult()
    by_id = {c["id"]: c for c in candidates}
    shortlist = [by_id[i] for i in shortlist_ids if i in by_id]
    return request_votes(
        instructions=prompts.INSTRUCTIONS_LLM_SIMILAR_ONLY,
        target=target,
        candidates=shortlist,
        method_label=Method.LLM_SIMILAR_ONLY,
    )


PAID_METHODS = {
    Method.LLM_BROAD: llm_broad,
    Method.LLM_STRICT: llm_strict,
    Method.LLM_SIMILAR_ONLY: llm_similar_only,
}


# ----- free methods ---------------------------------------------------------


def similar_candidates(target: Question, public_candidate_ids: set[int]) -> list[int]:
    """
    Pool members from the Similar Questions feature (the Redis-cached
    `get_similar_posts` lookup that powers the sidebar), best match first,
    at most SIMILAR_TOP_K. Pool membership implies public + eligible, so
    no further filtering is needed.
    """
    if target.post_id is None:
        return []
    similar_post_ids = list(get_similar_posts(target.post) or [])
    if not similar_post_ids:
        return []

    by_post: dict[int, list[int]] = {}
    rows = (
        Question.objects.filter(post_id__in=similar_post_ids)
        .exclude(id=target.id)
        .values_list("post_id", "id")
    )
    for post_id, question_id in rows:
        by_post.setdefault(post_id, []).append(question_id)

    out: list[int] = []
    for post_id in similar_post_ids:  # preserve the similarity ranking
        for question_id in by_post.get(post_id, []):
            if question_id in public_candidate_ids:
                out.append(question_id)
                if len(out) >= SIMILAR_TOP_K:
                    return out
    return out


def community_link_candidates(
    target_id: int, public_candidate_ids: set[int]
) -> list[int]:
    """
    Question ids that already share an AggregateCoherenceLink with the
    target — i.e. someone in the community has drawn this link. Existence
    is the whole signal; votes on the aggregate are not consulted.
    """
    rows = AggregateCoherenceLink.objects.filter(
        Q(question1_id=target_id, question2_id__in=public_candidate_ids)
        | Q(question2_id=target_id, question1_id__in=public_candidate_ids)
    ).values_list("question1_id", "question2_id")
    return [q2 if q1 == target_id else q1 for q1, q2 in rows]
