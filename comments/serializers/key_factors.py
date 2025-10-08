from collections import Counter
from typing import Iterable

from comments.models import KeyFactor
from comments.services.key_factors import get_votes_for_key_factors
from users.models import User
from users.serializers import BaseUserSerializer


def serialize_key_factor_votes(key_factor: KeyFactor, vote_scores: list[int]):
    pivot_votes = Counter(vote_scores)

    return {
        "score": key_factor.votes_score,
        "aggregated_data": [
            {"score": score, "count": count} for score, count in pivot_votes.items()
        ],
        "user_vote": key_factor.user_vote,
    }


def serialize_key_factor(key_factor: KeyFactor, vote_scores: list[int] = None) -> dict:
    return {
        "id": key_factor.id,
        "driver": {"text": key_factor.driver.text} if key_factor.driver else None,
        "author": BaseUserSerializer(key_factor.comment.author).data,
        "comment_id": key_factor.comment_id,
        "post_id": key_factor.comment.on_post_id,
        "vote": serialize_key_factor_votes(key_factor, vote_scores or []),
    }


def serialize_key_factors_many(
    key_factors: Iterable[KeyFactor], current_user: User = None
):
    # Get original ordering of the comments
    ids = [p.pk for p in key_factors]
    qs = (
        KeyFactor.objects.filter(pk__in=ids)
        .filter_active()
        .select_related("comment__author", "driver")
    )

    if current_user:
        qs = qs.annotate_user_vote(current_user)

    # Restore the original ordering
    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    # Extract user votes
    votes_map = get_votes_for_key_factors(key_factors)

    return [
        serialize_key_factor(key_factor, vote_scores=votes_map.get(key_factor.id))
        for key_factor in objects
    ]
