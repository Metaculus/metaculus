from datetime import datetime, timezone as dt_timezone

import pytest

from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_conditional, create_question
from tests.unit.utils import datetime_aware

__all__ = [
    "question_binary",
    "question_numeric",
    "conditional_1",
    "question_binary_with_forecast_user_1",
]


@pytest.fixture()
def question_binary():
    return create_question(
        question_type=Question.QuestionType.BINARY,
        scheduled_close_time=datetime_aware(2025, 6, 1),
    )


@pytest.fixture()
def question_multiple_choice():
    return create_question(
        question_type=Question.QuestionType.MULTIPLE_CHOICE,
        options=["a", "b", "c", "d"],
        options_history=[("0001-01-01T00:00:00", ["a", "b", "c", "d"])],
    )


@pytest.fixture()
def question_numeric():
    return create_question(
        question_type=Question.QuestionType.NUMERIC,
        inbound_outcome_count=4,
        range_min=10,
        range_max=13,
        open_lower_bound=False,
        open_upper_bound=False,
    )


@pytest.fixture()
def question_discrete():
    return create_question(
        question_type=Question.QuestionType.DISCRETE,
        inbound_outcome_count=4,
        range_min=9.5,
        range_max=13.5,
        open_lower_bound=False,
        open_upper_bound=False,
    )


@pytest.fixture()
def question_date():
    return create_question(
        question_type=Question.QuestionType.DATE,
        inbound_outcome_count=4,
        range_min=datetime(2025, 1, 1).timestamp(),
        range_max=datetime(2028, 1, 1).timestamp(),
        open_lower_bound=False,
        open_upper_bound=False,
    )


@pytest.fixture()
def conditional_1(question_binary, question_numeric):
    return create_conditional(
        condition=question_binary,
        condition_child=question_numeric,
        question_yes=create_question(
            question_type=Question.QuestionType.NUMERIC,
            title="If Yes",
            scheduled_close_time=datetime_aware(2025, 6, 1),
        ),
        question_no=create_question(
            question_type=Question.QuestionType.NUMERIC,
            title="If No",
            scheduled_close_time=datetime_aware(2025, 6, 1),
        ),
    )


@pytest.fixture()
def question_binary_with_forecast_user_1(user1):
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        open_time=datetime(2000, 1, 1, tzinfo=dt_timezone.utc),
        scheduled_close_time=datetime(3000, 1, 1, tzinfo=dt_timezone.utc),
    )
    factory_post(question=question)
    question.user_forecasts.create(
        author=user1,
        probability_yes=0.6,
        start_time=datetime(2001, 1, 1, tzinfo=dt_timezone.utc),
    )
    return question
