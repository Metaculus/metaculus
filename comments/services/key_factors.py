from comments.models import KeyFactor
from users.models import User


def key_factor_vote(
    key_factor: KeyFactor, user: User, vote: int = None
) -> dict[int, int]:
    # Deleting existing vote
    key_factor.votes.filter(user=user).delete()

    if vote:
        key_factor.votes.create(user=user, score=vote)

    # Update counters
    return key_factor.update_vote_score()
