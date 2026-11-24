from datetime import timedelta

import pytest
from freezegun import freeze_time
from scipy.stats import binom

from questions.models import AggregateForecast, Question
from questions.types import AggregationMethod
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question
from tests.unit.utils import datetime_aware
from users.services.profile_stats import get_calibration_curve_data


def make_resolved_question_with_updates(updates: int, probability: float):
    """A public binary question that resolved Yes, whose aggregate was updated
    `updates` times at the same probability over its whole open period"""
    open_time = datetime_aware(2025, 1, 1)
    close_time = datetime_aware(2025, 3, 1)
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        open_time=open_time,
        scheduled_close_time=close_time,
        actual_close_time=close_time,
        scheduled_resolve_time=close_time + timedelta(days=1),
        actual_resolve_time=close_time + timedelta(days=1),
        resolution="yes",
        include_bots_in_aggregates=False,
    )
    factory_post(question=question)
    step = (close_time - open_time) / updates
    AggregateForecast.objects.bulk_create(
        AggregateForecast(
            question=question,
            method=AggregationMethod.RECENCY_WEIGHTED,
            start_time=open_time + i * step,
            end_time=open_time + (i + 1) * step if i < updates - 1 else None,
            forecast_values=[1 - probability, probability],
        )
        for i in range(updates)
    )
    return question


@freeze_time("2025-06-01")
@pytest.mark.parametrize("question_count", [1, 10])
def test_calibration_interval_counts_questions_not_updates(question_count):
    for _ in range(question_count):
        make_resolved_question_with_updates(updates=50, probability=0.6)

    curve = get_calibration_curve_data(
        aggregation_method=AggregationMethod.RECENCY_WEIGHTED
    )["calibration_curve"]
    bucket = next(b for b in curve if b["bin_lower"] <= 0.6 < b["bin_upper"])

    assert bucket["average_resolution"] == pytest.approx(1.0)
    # 50 updates per question must not shrink the interval: the sample size is
    # the number of questions, since each one has a single resolution
    n = question_count
    assert bucket["lower_confidence_interval"] == pytest.approx(
        binom.ppf(0.05, n, bucket["bin_lower"]) / n
    )
    assert bucket["upper_confidence_interval"] == pytest.approx(
        binom.ppf(0.95, n, bucket["bin_upper"]) / n
    )
