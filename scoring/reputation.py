from dataclasses import dataclass
from datetime import datetime
from collections import defaultdict
from typing import Sequence

from django.utils import timezone

from questions.models import Question
from scoring.models import Score
from users.models import User


# def get_reputation_at_time(user_id: int, time: datetime | None = None) -> Reputation:
#     """
#     Returns the reputation of a user at a given time.
#     """
#     if time is None:
#         time = timezone.now()
#     peer_scores = Score.objects.filter(
#         user_id=user_id,
#         score_type=Score.ScoreTypes.PEER,
#         question__in=Question.objects.filter_public(),
#         edited_at__lte=time,
#     ).distinct()
#     value = reputation_value(peer_scores)
#     return Reputation(user_id, value, time)


# def get_reputations_at_time(
#     user_ids: list[int], time: datetime | None = None
# ) -> list[Reputation]:
#     """
#     Returns the reputations of a list of users at a given time.
#     """
#     if time is None:
#         time = timezone.now()
#     peer_scores = Score.objects.filter(
#         user_id__in=user_ids,
#         score_type=Score.ScoreTypes.PEER,
#         question__in=Question.objects.filter_public(),
#         edited_at__lte=time,
#     ).distinct()
#     user_scores: dict[int, list[Score]] = defaultdict(list)
#     for score in peer_scores:
#         user_scores[score.user_id].append(score)
#     reputations = []
#     for user_id in user_ids:
#         value = reputation_value(user_scores[user_id])
#         reputations.append(Reputation(user_id, value, time))
#     return reputations


@dataclass
class Reputation:
    user_id: int
    value: float
    time: datetime


def reputation_value(scores: Sequence[Score]) -> float:
    return max(
        sum([score.score for score in scores])
        / (30 + sum([score.coverage for score in scores])),
        1e-6,
    )


def get_reputations_during_interval(
    user_ids: list[int], start: datetime, end: datetime | None = None
) -> dict[User, list[Reputation]]:
    """returns a dict reputations. Each one is a record of what a particular
    user's reputation was at a particular time.
    The reputation can change during the interval."""
    if end is None:
        end = timezone.now()
    peer_scores = Score.objects.filter(
        user_id__in=user_ids,
        score_type=Score.ScoreTypes.PEER,
        question__in=Question.objects.filter_public(),
        edited_at__lte=end,
    ).distinct()

    # setup
    scores_by_user: dict[int, dict[int, Score]] = defaultdict(dict)
    reputations: dict[int, list[Reputation]] = defaultdict(list)

    # Establish reputations at the start of the interval.
    old_peer_scores = list(
        peer_scores.filter(edited_at__lte=start).order_by("edited_at")
    )
    for score in old_peer_scores:
        scores_by_user[score.user_id][score.question_id] = score
    for user_id in user_ids:
        value = reputation_value(scores_by_user[user_id].values())
        reputations[user_id].append(Reputation(user_id, value, start))

    # Then, for each new score, add a new reputation record
    new_peer_scores = list(
        peer_scores.filter(edited_at__gt=start).order_by("edited_at")
    )
    for score in new_peer_scores:
        # update the scores by user, then calculate the updated reputation
        scores_by_user[score.user_id][score.question_id] = score
        value = reputation_value(scores_by_user[score.user_id].values())
        reputations[score.user_id].append(
            Reputation(score.user_id, value, score.edited_at)
        )
    return reputations
