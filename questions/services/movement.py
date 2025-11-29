import logging
from datetime import timedelta
from typing import Iterable

import sentry_sdk
from django.utils import timezone

from questions.models import Question, AggregateForecast
from questions.serializers.common import serialize_question_movement
from questions.types import QuestionMovement
from questions.utils import get_question_movement_period, get_last_forecast_in_the_past
from utils.cache import cache_per_object
from utils.db import transaction_repeatable_read
from utils.dtypes import flatten
from utils.the_math.aggregations import get_aggregations_at_time
from utils.the_math.measures import prediction_difference_for_sorting
from .forecasts import get_aggregated_forecasts_for_questions

logger = logging.getLogger(__name__)


def compute_question_movement(question: Question) -> float | None:
    now = timezone.now()

    cp_now = get_aggregations_at_time(
        question, now, [question.default_aggregation_method]
    ).get(question.default_aggregation_method)

    if not cp_now:
        return

    movement_period = get_question_movement_period(question)

    if (
        question.resolution_set_time
        and question.resolution_set_time < now - movement_period
    ):
        # questions that have resolved at least `movement_period` ago have no movement
        return 0.0

    cp_previous = get_aggregations_at_time(
        question,
        now - movement_period,
        [question.default_aggregation_method],
    ).get(question.default_aggregation_method)

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

    # Run this block at REPEATABLE READ isolation level to prevent race conditions.
    # We first perform a lightweight query fetching only id, start_time, and end_time
    # of AggregateForecast to identify the relevant rows, then re-fetch
    # the full data for those IDs. Without a stable snapshot, records might disappear
    # mid-process (e.g. due to concurrent CP recalculation), causing missing data errors.
    # REPEATABLE READ ensures both SELECTs see the same MVCC snapshot and avoids this race.
    with transaction_repeatable_read():
        # Step 1: Fetch aggregated forecasts with deferred `forecast_values` field.
        # We do this to significantly reduce data transfer size and Django model instance serialization time,
        # because the `forecast_values` object can be quite large.
        question_aggregated_forecasts_map = get_aggregated_forecasts_for_questions(
            # Only forecasted questions
            compare_periods_map.keys(),
            aggregated_forecast_qs=(
                AggregateForecast.objects.filter_default_aggregation().only(
                    "id", "start_time", "question_id", "end_time"
                )
            ),
            include_cp_history=True,
        )

        agg_id_map: dict[Question, tuple[int, int]] = {}
        now = timezone.now()

        # Step 2: find First and Last AggregateForecast for each question
        for question in questions:
            delta = compare_periods_map.get(question)
            aggregated_forecasts = question_aggregated_forecasts_map.get(question)

            if not delta or not aggregated_forecasts:
                continue

            from_date = now - delta

            # Skip hidden CP
            if question.is_cp_hidden:
                continue

            last_agg = get_last_forecast_in_the_past(aggregated_forecasts)
            first_agg = (
                next(
                    (
                        agg
                        for agg in aggregated_forecasts
                        if agg.start_time <= from_date
                        and agg.start_time <= now
                        and (agg.end_time is None or agg.end_time > from_date)
                    ),
                    None,
                )
                or last_agg
            )

            # This is possible if question has gaps the in forecasting timeline
            if not last_agg or not first_agg:
                continue

            agg_id_map[question] = (first_agg.id, last_agg.id)

        # 3) Bulk‐fetch full forecasts for just those IDs
        full_aggs = {
            x.id: x
            for x in AggregateForecast.objects.filter(
                pk__in=flatten(agg_id_map.values())
            )
        }

    # 4) Compute and return the movement per question
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
