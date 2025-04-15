from typing import Iterable

from django.db import transaction
from rest_framework.exceptions import ValidationError

from comments.models import KeyFactor, KeyFactorVote, Comment
from users.models import User
from utils.dtypes import generate_map_from_list


@transaction.atomic
def key_factor_vote(
    key_factor: KeyFactor,
    user: User,
    vote: int = None,
    vote_type: KeyFactorVote.VoteType = None,
) -> dict[int, int]:
    # Deleting existing vote for this vote type
    key_factor.votes.filter(user=user, vote_type=vote_type).delete()

    if vote:
        key_factor.votes.create(user=user, score=vote, vote_type=vote_type)

    # Update counters
    return key_factor.update_vote_score()


def get_user_votes_for_key_factors(
    key_factors: Iterable[KeyFactor], user: User
) -> dict[int, list[KeyFactor]]:
    """
    Generates map of user votes for a set of KeyFactors
    """

    votes = KeyFactorVote.objects.filter(key_factor__in=key_factors, user=user)

    return generate_map_from_list(list(votes), key=lambda vote: vote.key_factor_id)


@transaction.atomic
def create_key_factors(comment: Comment, key_factors: list[str]):
    # Limit total key-factors for one user per comment
    if comment.key_factors.filter_active().count() + len(key_factors) > 4:
        raise ValidationError(
            "Exceeded the maximum limit of 4 key factors allowed per comment"
        )

    # Limit total key-factors amount for one user per post
    if (
        KeyFactor.objects.for_posts(posts=[comment.on_post])
        .filter_active()
        .filter(comment__author=comment.author)
        .count()
        + len(key_factors)
        > 6
    ):
        raise ValidationError(
            "Exceeded the maximum limit of 6 key factors allowed per question"
        )

    for key_factor in key_factors:
        KeyFactor.objects.create(comment=comment, text=key_factor)
