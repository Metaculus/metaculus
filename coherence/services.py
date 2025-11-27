from django.db import transaction
from django.db.models import Q

from coherence.models import (
    CoherenceLink,
    AggregateCoherenceLink,
    LinkType,
)
from questions.models import Question
from questions.services.forecasts import get_user_last_forecasts_map
from users.models import User
from datetime import datetime


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


def get_links_for_question(question: Question, user: User):
    links = CoherenceLink.objects.filter(Q(question1=question), user=user)
    return links


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
