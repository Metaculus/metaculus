import logging
from collections import defaultdict
from datetime import timedelta
from typing import Iterable

import sentry_sdk
from django.db.models import Q
from django.utils import timezone

from questions.models import Question, AggregateForecast
from questions.serializers.common import serialize_question_movement
from questions.types import QuestionMovement
from questions.utils import get_question_movement_period
from utils.cache import cache_per_object
from utils.db import transaction_repeatable_read
from utils.dtypes import flatten
from utils.the_math.measures import prediction_difference_for_sorting
from .common import get_aggregate_forecast_at

logger = logging.getLogger(__name__)


def compute_question_movement(question: Question) -> float | None:
    now = timezone.now()

    cp_now = get_aggregate_forecast_at(question, now)

    if not cp_now:
        return

    if question.resolution_set_time and question.resolution_set_time < now - timedelta(
        days=7
    ):
        # questions that have resolved at least 7 days ago have no movement
        return 0.0

    cp_previous = get_aggregate_forecast_at(
        question, now - get_question_movement_period(question)
    )

    if not cp_previous:
        return

    return prediction_difference_for_sorting(
        cp_now.get_prediction_values(),
        cp_previous.get_prediction_values(),
        question.type,
    )


def calculate_period_movement_for_questions(
    questions: Iterable[Question],
    compare_periods_map: dict[Question, timedelta],
    threshold: float = 0.25,
) -> dict[Question, QuestionMovement | None]:
    """
    Calculate, for each question, how much forecast has moved
    between the user last forecasting date and the latest aggregate forecasts.
    """

    question_movement_map: dict[Question, QuestionMovement | None] = {
        q: None for q in questions
    }
    now = timezone.now()
    from_dates = {
        question: now - delta
        for question in questions
        if (delta := compare_periods_map.get(question)) and not question.is_cp_hidden
    }
    default_aggregates = AggregateForecast.objects.filter_default_aggregation()
    agg_id_map: dict[Question, tuple[int, int]] = {}

    # The id lookups and the re-fetch must share a snapshot, as rebuilds reuse ids
    with transaction_repeatable_read():
        last_aggs = {
            agg.question_id: agg
            for agg in default_aggregates.filter(
                question_id__in=[q.id for q in from_dates], start_time__lte=now
            )
            .filter(Q(end_time__isnull=True) | Q(end_time__gt=now))
            .order_by("question_id", "-start_time")
            .distinct("question_id")
            .only("id", "question_id", "forecaster_count")
        }

        # Skip movement for questions that are too new and have too few forecasters
        # Must be either 2+ weeks old OR have 20+ forecasters
        from_dates = {
            question: from_date
            for question, from_date in from_dates.items()
            if (last_agg := last_aggs.get(question.id))
            and (
                (question.open_time and question.open_time <= now - timedelta(days=14))
                or (last_agg.forecaster_count or 0) >= 20
            )
        }

        question_ids_by_from_date = defaultdict(list)
        for question, from_date in from_dates.items():
            question_ids_by_from_date[from_date].append(question.id)
        active_at_from_date = Q()
        for from_date, question_ids in question_ids_by_from_date.items():
            active_at_from_date |= Q(
                question_id__in=question_ids, start_time__lte=min(from_date, now)
            ) & (Q(end_time__isnull=True) | Q(end_time__gt=from_date))
        first_agg_ids = (
            dict(
                default_aggregates.filter(active_at_from_date)
                .order_by("question_id", "start_time")
                .distinct("question_id")
                .values_list("question_id", "id")
            )
            if from_dates
            else {}
        )

        for question in from_dates:
            last_id = last_aggs[question.id].id
            agg_id_map[question] = (first_agg_ids.get(question.id, last_id), last_id)

        full_aggs = AggregateForecast.objects.only(
            "forecast_values", "interval_lower_bounds", "interval_upper_bounds"
        ).in_bulk(flatten(agg_id_map.values()))

    # Compute and return the movement per question
    for question, (first_id, last_id) in agg_id_map.items():
        f1 = full_aggs[first_id]
        f2 = full_aggs[last_id]
        period = compare_periods_map.get(question)

        question_movement_map[question] = serialize_question_movement(
            question, f1, f2, period, threshold=threshold
        )

    return question_movement_map


@sentry_sdk.trace
@cache_per_object(timeout=60 * 10)
def calculate_movement_for_questions(
    questions: Iterable[Question],
) -> dict[Question, QuestionMovement | None]:
    """
    Generates question movement based on its lifetime
    """

    now = timezone.now()
    questions = [
        q
        for q in questions
        # Our max movement period is 7 days, so we want to skip other questions
        if (not q.actual_close_time or now - q.actual_close_time <= timedelta(days=7))
        # We don't want to calculate movement for groups right now
        and not q.group_id
    ]

    return calculate_period_movement_for_questions(
        questions,
        {q: get_question_movement_period(q) for q in questions if q.open_time},
        threshold=0,
    )
