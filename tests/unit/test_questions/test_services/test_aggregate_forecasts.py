from datetime import timedelta

import pytest
from django.utils import timezone

from questions.models import AggregateForecast, Question
from questions.services.forecasts import get_last_aggregated_forecasts_for_questions
from questions.types import AggregationMethod
from tests.unit.test_questions.factories import create_question


def aggregate(question: Question, method: AggregationMethod, days_ago: float):
    return AggregateForecast.objects.create(
        question=question,
        method=method,
        start_time=timezone.now() - timedelta(days=days_ago),
        forecast_values=[0.4, 0.6],
    )


@pytest.mark.parametrize("staff", [False, True])
def test_last_aggregated_forecasts_per_question_and_method(
    django_assert_num_queries, staff
):
    binary = Question.QuestionType.BINARY
    question = create_question(question_type=binary)
    for days_ago in (5, 4, 3):
        aggregate(question, AggregationMethod.RECENCY_WEIGHTED, days_ago)
    recency = aggregate(question, AggregationMethod.RECENCY_WEIGHTED, 2)
    aggregate(question, AggregationMethod.RECENCY_WEIGHTED, -1)
    aggregate(question, AggregationMethod.UNWEIGHTED, 4)
    unweighted = aggregate(question, AggregationMethod.UNWEIGHTED, 1)
    aggregate(question, AggregationMethod.REPUTATION_WEIGHTED, 3)
    shadow = aggregate(question, AggregationMethod.REPUTATION_WEIGHTED, 2)

    shadow_default = create_question(
        question_type=binary,
        default_aggregation_method=AggregationMethod.REPUTATION_WEIGHTED,
    )
    aggregate(shadow_default, AggregationMethod.REPUTATION_WEIGHTED, 3)
    shadow_default_latest = aggregate(
        shadow_default, AggregationMethod.REPUTATION_WEIGHTED, 1
    )
    shadow_default_unweighted = aggregate(
        shadow_default, AggregationMethod.UNWEIGHTED, 2
    )

    only_future = create_question(question_type=binary)
    aggregate(only_future, AggregationMethod.RECENCY_WEIGHTED, -1)
    empty = create_question(question_type=binary)

    aggregated_forecast_qs = (
        AggregateForecast.objects.all()
        if staff
        else AggregateForecast.objects.exclude_shadow_aggregations()
    )
    with django_assert_num_queries(1):
        forecasts = list(
            get_last_aggregated_forecasts_for_questions(
                [question, shadow_default, only_future, empty], aggregated_forecast_qs
            )
        )

    expected = {recency, unweighted, shadow_default_latest, shadow_default_unweighted}
    if staff:
        expected.add(shadow)
    assert forecasts == sorted(expected, key=lambda f: (f.question_id, f.method))
    assert not any(forecast.get_deferred_fields() for forecast in forecasts)
