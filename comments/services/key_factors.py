from django.db import transaction

from comments.models import KeyFactor, KeyFactorVote
from users.models import User


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


@transaction.atomic
def create_key_factors(comment_id: int, key_factors: list[str]):
    for key_factor in key_factors:
        KeyFactor.objects.create(comment_id=comment_id, text=key_factor)
