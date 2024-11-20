from collections import defaultdict

from comments.models import KeyFactor
from posts.models import Post
from users.models import User


def get_key_factors_for_post(post: Post):
    return KeyFactor.objects.filter(comment__on_post=post)


def get_key_factor_vote_summary(key_factor: KeyFactor) -> dict[int, int]:
    votes_summary = defaultdict(int)

    for vote in key_factor.votes.all():
        votes_summary[vote.score] += 1

    return dict(votes_summary)


def key_factor_vote(key_factor: KeyFactor, user: User, score: int = None):
    # Deleting existing vote
    key_factor.votes.filter(user=user).delete()

    if score:
        key_factor.votes.create(user=user, score=score)

    # Update counters
    key_factor.update_vote_score()

    return get_key_factor_vote_summary(key_factor)
