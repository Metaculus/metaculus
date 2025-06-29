from dataclasses import dataclass
from datetime import datetime
from collections import defaultdict
from typing import Sequence

from django.utils import timezone

from questions.models import Question
from scoring.constants import ScoreTypes
from scoring.models import Score
from users.models import User


@dataclass
class Reputation:
    user: User
    value: float
    time: datetime


def reputation_value(scores: Sequence[Score]) -> float:
    return max(
        sum([score.score for score in scores])
        / (30 + sum([score.coverage for score in scores])),
        1e-6,
    )


def get_reputation_at_time(user: User, time: datetime | None = None) -> Reputation:
    """
    Returns the reputation of a user at a given time.
    """
    if time is None:
        time = timezone.now()
    peer_scores = Score.objects.filter(
        user=user,
        score_type=ScoreTypes.PEER,
        question__in=Question.objects.filter_public(),
        edited_at__lte=time,
    ).distinct()
    value = reputation_value(peer_scores)
    return Reputation(user, value, time)


def get_reputations_at_time(
    users: list[User], time: datetime | None = None
) -> list[Reputation]:
    """
    Returns the reputations of a list of users at a given time.
    """
    if time is None:
        time = timezone.now()
    peer_scores = Score.objects.filter(
        user__in=users,
        score_type=ScoreTypes.PEER,
        question__in=Question.objects.filter_public(),
        edited_at__lte=time,
    ).distinct()
    user_scores: dict[User, list[Score]] = defaultdict(list)
    for score in peer_scores:
        user_scores[score.user].append(score)
    reputations = []
    for user in users:
        value = reputation_value(peer_scores)
        reputations.append(Reputation(user, value, time))
    return reputations


def get_reputations_during_interval(
    users: list[User], start: datetime, end: datetime | None = None
) -> dict[User, list[Reputation]]:
    """returns a dict reputations. Each one is a record of what a particular
    user's reputation was at a particular time.
    The reputation can change during the interval."""
    if end is None:
        end = timezone.now()
    all_peer_scores = (
        Score.objects.filter(
            user__in=users,
            score_type=ScoreTypes.PEER,
            question__in=Question.objects.filter_public(),
            edited_at__lte=end,
        )
        .prefetch_related("user", "question")
        .distinct()
    )
    old_peer_scores = list(
        all_peer_scores.filter(edited_at__lte=start).order_by("edited_at")
    )
    new_peer_scores = list(
        all_peer_scores.filter(edited_at__gt=start).order_by("edited_at")
    )
    scores_by_user: dict[User, dict[Question, Score]] = defaultdict(dict)
    for score in old_peer_scores:
        scores_by_user[score.user][score.question] = score
    reputations: dict[User, list[Reputation]] = defaultdict(list)
    for user in users:
        value = reputation_value(scores_by_user[user].values())
        reputations[user].append(Reputation(user, value, start))
    for score in new_peer_scores:
        scores_by_user[score.user][score.question] = score
        value = reputation_value(scores_by_user[user].values())
        reputations[user].append(Reputation(score.user, value, score.edited_at))
    return reputations
