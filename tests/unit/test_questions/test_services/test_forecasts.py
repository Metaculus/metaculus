from datetime import datetime

import freezegun
import pytest  # noqa
from django.utils.timezone import make_aware

from questions.models import AggregateForecast, Question
from questions.serializers.aggregate_forecasts import (
    serialize_question_aggregations,
)
from questions.services.forecasts import (
    get_aggregated_forecasts_for_questions,
    get_last_aggregated_forecasts_for_questions,
)
from questions.types import AggregationMethod
from tests.unit.test_questions.factories import create_question


def _dt(*args):
    return make_aware(datetime(*args))


def _make_aggregate(question, start_time, end_time, center):
    # Binary aggregates store both outcomes; serialization strips the first element.
    return AggregateForecast.objects.create(
        question=question,
        method=question.default_aggregation_method,
        start_time=start_time,
        end_time=end_time,
        forecast_values=[1 - center, center],
        centers=[1 - center, center],
        interval_lower_bounds=[1 - center, center],
        interval_upper_bounds=[1 - center, center],
        forecaster_count=5,
    )


@freezegun.freeze_time("2024-06-01")
class TestCPAtResolutionTime:
    """
    A question resolved as of a past date keeps accumulating aggregate forecasts
    after that date (it appeared open until the resolution was entered). The default
    CP preview must reflect the value at resolution/close time, not those later
    aggregations.
    """

    def _build_retroactively_resolved_question(self) -> Question:
        # Scheduled to close in the future, but resolved as of a past date.
        question = create_question(
            question_type=Question.QuestionType.BINARY,
            default_aggregation_method=AggregationMethod.RECENCY_WEIGHTED,
            open_time=_dt(2024, 1, 1),
            scheduled_close_time=_dt(2024, 12, 31),
            scheduled_resolve_time=_dt(2024, 12, 31),
            actual_resolve_time=_dt(2024, 3, 1),
            # min(actual_resolve_time, scheduled_close_time)
            actual_close_time=_dt(2024, 3, 1),
            resolution="yes",
            resolution_set_time=_dt(2024, 5, 1),
        )
        # CP live at resolution time (2024-03-01)
        _make_aggregate(question, _dt(2024, 2, 1), _dt(2024, 4, 1), 0.7)
        # CP after resolution time (question still looked open until 2024-05-01)
        _make_aggregate(question, _dt(2024, 4, 1), _dt(2024, 5, 1), 0.2)
        _make_aggregate(question, _dt(2024, 5, 1), None, 0.1)
        return question

    def test_last_aggregate_is_capped_at_close_time_for_resolved_question(self):
        question = self._build_retroactively_resolved_question()

        last = list(
            get_last_aggregated_forecasts_for_questions(
                [question], AggregateForecast.objects.all()
            )
        )
        assert len(last) == 1
        # The CP at resolution time, not the last (0.1) forecast.
        assert last[0].centers[1] == 0.7

    def test_serialized_latest_uses_resolution_time_cp_with_full_history(self):
        question = self._build_retroactively_resolved_question()

        forecasts_by_question = get_aggregated_forecasts_for_questions(
            [question], include_cp_history=True
        )
        serialized = serialize_question_aggregations(
            question, forecasts_by_question[question]
        )
        method_data = serialized[question.default_aggregation_method]

        # History still contains every aggregation...
        assert len(method_data["history"]) == 3
        # ...but the default preview is the CP at resolution time.
        assert method_data["latest"]["centers"] == [0.7]

    def test_open_question_still_uses_most_recent_cp(self):
        question = create_question(
            question_type=Question.QuestionType.BINARY,
            default_aggregation_method=AggregationMethod.RECENCY_WEIGHTED,
            open_time=_dt(2024, 1, 1),
            scheduled_close_time=_dt(2024, 12, 31),
        )
        _make_aggregate(question, _dt(2024, 2, 1), _dt(2024, 5, 1), 0.7)
        _make_aggregate(question, _dt(2024, 5, 1), None, 0.4)

        last = list(
            get_last_aggregated_forecasts_for_questions(
                [question], AggregateForecast.objects.all()
            )
        )
        assert len(last) == 1
        assert last[0].centers[1] == 0.4
