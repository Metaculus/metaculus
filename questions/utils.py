import datetime
import re
from datetime import timedelta

from django.utils import timezone

from questions.models import Question, AggregateForecast, Forecast
from questions.constants import QuestionStatus


def get_question_group_title(title: str) -> str:
    """
    Extracts name from question of group.

    E.g. Long Question Title? (Option A) -> Option A
    """

    matches = re.findall(r"\((?:[^()]*|\([^()]*\))*\)", title)
    return matches[-1][1:-1] if matches else title


def calculate_question_lifespan_from_date(
    question: Question, from_date: datetime.datetime
) -> float | None:
    if not question.open_time or not question.scheduled_close_time:
        return

    duration = question.scheduled_close_time - question.open_time
    passed = timezone.now() - from_date

    return passed / duration


def get_question_movement_period(question: Question):
    if timezone.now() - question.open_time < timedelta(hours=24):
        return timedelta(hours=1)

    if timezone.now() - question.open_time < timedelta(days=7):
        return timedelta(hours=24)

    return timedelta(days=7)


def get_last_forecast_in_the_past(
    aggregated_forecasts: list[Forecast | AggregateForecast],
    at_time: datetime.datetime = None,
) -> AggregateForecast | None:
    """
    Returns last aggregated forecast in the past.
    Used to infiltrate aggregations from the future made by "Forecasts Expiration" module.

    Please note: aggregated_forecasts should be already sorted ASC `start_time`
    """

    at_time = at_time or timezone.now()

    # Briefly checks its ASC order
    # Don't perform double-sorting for optimization
    if (
        aggregated_forecasts
        and aggregated_forecasts[0].start_time > aggregated_forecasts[-1].start_time
    ):
        raise ValueError("aggregated_forecasts should be already sorted ASC")

    return next(
        (
            agg
            for agg in reversed(aggregated_forecasts)
            # Ensure we do not count aggregations in the future
            # Which could happen when user has explicit expire date of the forecast
            if agg.start_time <= at_time
            # Handle withdrawn forecasts
            and (agg.end_time is None or agg.end_time > at_time)
        ),
        None,
    )


def has_question_enough_data_for_movement(question: Question):
    if not question.open_time:
        return False

    now = timezone.now()
    question_age = now - question.open_time

    is_above_2_weeks = question_age >= timedelta(days=14)

    is_open = question.status == QuestionStatus.OPEN

    # Use annotated field if available to avoid N+1 queries
    if hasattr(question, "forecasters_count"):
        forecasters_count = question.forecasters_count or 0
    else:
        forecasters_count = question.get_forecasters().count()

    has_above_20_forecasters = forecasters_count > 20

    return is_above_2_weeks or (is_open and has_above_20_forecasters)
