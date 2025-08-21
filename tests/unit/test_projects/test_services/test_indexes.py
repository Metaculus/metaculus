import datetime

import pytest
from freezegun import freeze_time

from projects.services.indexes import calculate_questions_index_timeline, IndexPoint
from questions.constants import UnsuccessfulResolutionType
from questions.models import Question, AggregateForecast
from questions.types import AggregationMethod
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import create_question
from tests.unit.utils import datetime_aware


def add_agg(
    question: Question,
    start: datetime.datetime,
    end: datetime.datetime | None = None,
    forecast_values: list[float] | None = None,
):
    AggregateForecast(
        question=question,
        start_time=start,
        end_time=end,
        method=AggregationMethod.RECENCY_WEIGHTED,
        centers=forecast_values,
        forecast_values=forecast_values,
    ).save()


def find_point(data: list[IndexPoint], dt: datetime.datetime):
    return next(x for x in data if x["x"] == dt.timestamp())["y"]


@freeze_time("2025-01-10")
def test_calculate_questions_index_timeline():
    question_annulled_overlap = create_question(
        question_type=Question.QuestionType.BINARY,
        scheduled_close_time=datetime_aware(2025, 1, 5),
        actual_close_time=datetime_aware(2025, 1, 5),
        # Actual resolution time happened before last forecast was made
        actual_resolve_time=datetime_aware(2025, 1, 5),
        resolution=UnsuccessfulResolutionType.ANNULLED,
    )
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        scheduled_close_time=datetime_aware(2025, 1, 7),
        actual_close_time=datetime_aware(2025, 1, 7),
        # TODO: what if resolve time < close time?
        actual_resolve_time=datetime_aware(2025, 1, 8),
        resolution="no",
    )

    # Question #1
    add_agg(
        question_annulled_overlap,
        start=datetime_aware(2025, 1, 1),
        end=datetime_aware(2025, 1, 2),
        forecast_values=[0.55, 0.45],
    )
    add_agg(
        question_annulled_overlap,
        start=datetime_aware(2025, 1, 2),
        end=datetime_aware(2025, 1, 3),
        forecast_values=[0.33, 0.67],
    )
    add_agg(
        question_annulled_overlap,
        start=datetime_aware(2025, 1, 3),
        end=datetime_aware(2025, 1, 4),
        forecast_values=[0.33, 0.67],
    )
    # Overlapping score
    add_agg(
        question_annulled_overlap,
        start=datetime_aware(2025, 1, 4),
        forecast_values=[0.45, 0.55],
    )

    # Question #2
    add_agg(
        question,
        start=datetime_aware(2025, 1, 4),
        end=datetime_aware(2025, 1, 5),
        forecast_values=[0.6, 0.4],
    )
    add_agg(
        question,
        start=datetime_aware(2025, 1, 5),
        end=datetime_aware(2025, 1, 6),
        forecast_values=[0.4, 0.6],
    )
    add_agg(
        question,
        start=datetime_aware(2025, 1, 6),
        forecast_values=[0.25, 0.75],
    )

    data = calculate_questions_index_timeline(
        {question: 1, question_annulled_overlap: 1}
    )

    # Aggregations from question #1 only!
    assert find_point(data, datetime_aware(2025, 1, 1)) == pytest.approx(-10)
    assert find_point(data, datetime_aware(2025, 1, 2)) == pytest.approx(34)
    assert find_point(data, datetime_aware(2025, 1, 3)) == pytest.approx(34)

    # Overlapped aggregation
    assert find_point(data, datetime_aware(2025, 1, 4)) == pytest.approx(-5)

    # Aggregations from question #2 only! First question was annulled,
    # so its weights won't be included
    assert find_point(data, datetime_aware(2025, 1, 5)) == pytest.approx(20)
    assert find_point(data, datetime_aware(2025, 1, 6)) == pytest.approx(50)
    assert find_point(data, datetime_aware(2025, 1, 7)) == pytest.approx(50)
    # Date of resolution was added to the timeline
    assert find_point(data, datetime_aware(2025, 1, 8)) == pytest.approx(-100)
    # Today's date was added automatically
    assert find_point(data, datetime_aware(2025, 1, 10)) == pytest.approx(-100)


@freeze_time("2025-01-10")
def test_calculate_questions_index_timeline__negative_values():
    question_1 = create_question(
        question_type=Question.QuestionType.BINARY,
        scheduled_close_time=datetime_aware(2025, 1, 10),
    )
    question_2 = create_question(
        question_type=Question.QuestionType.BINARY,
        scheduled_close_time=datetime_aware(2025, 1, 10),
    )

    # Question #1
    add_agg(
        question_1,
        start=datetime_aware(2025, 1, 4),
        end=datetime_aware(2025, 1, 5),
        forecast_values=[0.55, 0.45],
    )
    add_agg(
        question_1,
        start=datetime_aware(2025, 1, 5),
        forecast_values=[0.33, 0.67],
    )

    # Question #2
    add_agg(
        question_2,
        start=datetime_aware(2025, 1, 4),
        end=datetime_aware(2025, 1, 5),
        forecast_values=[0.35, 0.65],
    )
    add_agg(
        question_2,
        start=datetime_aware(2025, 1, 5),
        forecast_values=[0.23, 0.77],
    )

    data = calculate_questions_index_timeline(
        {
            question_1: -2,
            question_2: 0.5,
        }
    )

    # Aggregations from question #1 only!
    assert find_point(data, datetime_aware(2025, 1, 4)) == pytest.approx(14)
    assert find_point(data, datetime_aware(2025, 1, 5)) == pytest.approx(-16.4)


@freeze_time("2025-01-10")
def test_calculate_questions_index_timeline__unsuccessfully_resolved():
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        scheduled_close_time=datetime_aware(2025, 1, 8),
        actual_close_time=datetime_aware(2025, 1, 8),
        # This is a test case for actual resolution time < close time
        actual_resolve_time=datetime_aware(2025, 1, 5),
        resolution=UnsuccessfulResolutionType.ANNULLED,
    )

    add_agg(
        question,
        start=datetime_aware(2025, 1, 4),
        end=datetime_aware(2025, 1, 5),
        forecast_values=[0.25, 0.75],
    )
    add_agg(
        question,
        start=datetime_aware(2025, 1, 5),
        end=datetime_aware(2025, 1, 6),
        forecast_values=[0.55, 0.45],
    )
    add_agg(
        question,
        start=datetime_aware(2025, 1, 6),
        forecast_values=[0.3, 0.7],
    )

    data = calculate_questions_index_timeline({question: 1})

    assert find_point(data, datetime_aware(2025, 1, 4)) == pytest.approx(50)
    assert find_point(data, datetime_aware(2025, 1, 5)) == 0
    assert find_point(data, datetime_aware(2025, 1, 6)) == 0
    assert find_point(data, datetime_aware(2025, 1, 10)) == 0


@freeze_time("2025-01-10")
def test_calculate_questions_index_timeline__ongoing():
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        scheduled_close_time=datetime_aware(2025, 1, 9),
    )

    add_agg(
        question,
        start=datetime_aware(2025, 1, 4),
        end=datetime_aware(2025, 1, 5),
        forecast_values=[0.25, 0.75],
    )
    add_agg(
        question,
        start=datetime_aware(2025, 1, 5),
        forecast_values=[0.55, 0.45],
    )

    data = calculate_questions_index_timeline({question: 1})

    assert find_point(data, datetime_aware(2025, 1, 4)) == pytest.approx(50)
    assert find_point(data, datetime_aware(2025, 1, 5)) == pytest.approx(-10)
    assert find_point(data, datetime_aware(2025, 1, 10)) == pytest.approx(-10)
