from typing import Iterable

from django.db.models import Count

from comments.models import KeyFactor, KeyFactorVote
from comments.services.key_factors import get_user_votes_for_key_factors
from users.models import User
from users.serializers import BaseUserSerializer


def serialize_key_factor(
    key_factor: KeyFactor, user_votes: list[KeyFactorVote] = None
) -> dict:
    user_votes = user_votes or []

    return {
        "id": key_factor.id,
        "driver": {"text": key_factor.driver.text} if key_factor.driver else None,
        "author": BaseUserSerializer(key_factor.comment.author).data,
        "comment_id": key_factor.comment_id,
        "post_id": key_factor.comment.on_post_id,
        "user_votes": [
            {"vote_type": vote.vote_type, "score": vote.score} for vote in user_votes
        ],
        "votes_score": key_factor.votes_score,
        "votes_count": getattr(key_factor, "votes_count"),
        "vote_type": key_factor.vote_type,
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
        .annotate(votes_count=Count("votes"))
    )

    # Restore the original ordering
    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    # Extract user votes
    user_votes_map = (
        get_user_votes_for_key_factors(key_factors, current_user)
        if current_user and not current_user.is_anonymous
        else {}
    )

    return [
        serialize_key_factor(key_factor, user_votes=user_votes_map.get(key_factor.id))
        for key_factor in objects
    ]
