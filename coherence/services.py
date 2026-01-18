from collections import defaultdict
from datetime import datetime, timedelta
from typing import Iterable

from django.db import transaction
from django.utils import timezone

from coherence.models import (
    CoherenceLink,
    AggregateCoherenceLink,
    LinkType,
    AggregateCoherenceLinkVote,
)
from questions.models import Question
from questions.services.forecasts import get_user_last_forecasts_map
from users.models import User


def create_coherence_link(
    *,
    user: User = None,
    question1: Question = None,
    question2: Question = None,
    direction: int = None,
    strength: int = None,
    link_type: LinkType = None,
):
    with transaction.atomic():
        obj = CoherenceLink(
            user=user,
            question1=question1,
            question2=question2,
            direction=direction,
            strength=strength,
            type=link_type,
        )

        # Save project and validate
        obj.full_clean()
        obj.save()
        create_aggregate_coherence_link(
            question1=question1, question2=question2, link_type=link_type
        )

    return obj


def create_aggregate_coherence_link(
    *,
    question1: Question = None,
    question2: Question = None,
    link_type: LinkType = None,
):
    with transaction.atomic():
        obj, created = AggregateCoherenceLink.objects.get_or_create(
            question1=question1,
            question2=question2,
            type=link_type,
        )

        if created:
            obj.full_clean()
            obj.save()

    return obj


def get_stale_linked_questions(
    links: list[CoherenceLink], question: Question, user: User, last_datetime: datetime
):
    questions = [link.question2 for link in links]

    # In order to avoid making a separate query
    questions.append(question)
    last_forecast_map = get_user_last_forecasts_map(questions, user=user)
    question_last_forecast = last_forecast_map.get(question, None)

    if not question_last_forecast:
        return []

    question_forecast_time = question_last_forecast.start_time
    if last_datetime > question_forecast_time:
        return []

    return [
        current_question
        for current_question, last_forecast in last_forecast_map.items()
        if current_question.id != question.id
        and (not last_forecast or last_forecast.start_time < question_forecast_time)
    ]


@transaction.atomic
def aggregate_coherence_link_vote(
    aggregation: AggregateCoherenceLink,
    user: User,
    vote: int = None,
):
    # Deleting existing vote for this vote type
    aggregation.votes.filter(user=user).delete()

    if vote is not None:
        aggregation.votes.create(user=user, score=vote)


def get_votes_for_aggregate_coherence_links(
    aggregations: Iterable[AggregateCoherenceLink],
) -> dict[int, list[AggregateCoherenceLink]]:
    """
    Generates map of user votes for a set of KeyFactors
    """

    votes = AggregateCoherenceLinkVote.objects.filter(aggregation__in=aggregations)
    votes_map = defaultdict(list)

    for vote in votes:
        votes_map[vote.aggregation_id].append(vote)

    return votes_map


def calculate_freshness_aggregate_coherence_link(
    question: Question,
    aggregation: AggregateCoherenceLink,
    votes: list[AggregateCoherenceLinkVote],
) -> float:
    """
    Freshness doesn't decay over time
    """

    target_question = (
        aggregation.question1
        if aggregation.question1 != question
        else aggregation.question2
    )

    # If question resolved > 2w ago -> link does not make sense
    if (
        target_question.actual_resolve_time
        and timezone.now() - target_question.actual_resolve_time > timedelta(days=14)
    ):
        return 0.0

    if not votes:
        return 0.0

    freshness = sum([x.score for x in votes]) + 2 * max(0, 3 - len(votes)) / max(
        len(votes), 3
    )

    return max(0.0, freshness)
