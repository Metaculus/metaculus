import datetime
import re
from datetime import timedelta

from django.utils import timezone

from questions.models import Question, AggregateForecast


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


def get_last_aggregated_forecast_in_the_past(
    aggregated_forecasts: list[AggregateForecast],
) -> AggregateForecast | None:
    """
    Returns last aggregated forecast in the past.
    Used to infiltrate aggregations from the future made by "Forecasts Expiration" module.

    Please note: aggregated_forecasts should be already sorted ASC `start_time`
    """

    return next(
        (
            agg
            for agg in reversed(aggregated_forecasts)
            # Ensure we do not count aggregations in the future
            # Which could happen when user has explicit expire date of the forecast
            if agg.start_time <= timezone.now()
        ),
        None,
    )
