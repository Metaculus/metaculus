from datetime import datetime, timezone as dt_timezone

import pytest

from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_conditional, create_question

__all__ = [
    "open_question",
    "question_binary",
    "question_multiple_choice",
    "question_numeric",
    "conditional_1",
    "question_binary_with_forecast_user_1",
]


@pytest.fixture()
def open_question():
    return create_question(
        open_time=datetime.min,
        scheduled_close_time=datetime.max,
        scheduled_resolve_time=datetime.max,
        cp_reveal_time=datetime.min,
        spot_scoring_time=datetime.max,
    )


@pytest.fixture()
def question_binary(open_question):
    return create_question(
        question=open_question, question_type=Question.QuestionType.BINARY
    )


@pytest.fixture()
def question_multiple_choice(open_question):
    return create_question(
        question=open_question,
        question_type=Question.QuestionType.MULTIPLE_CHOICE,
        options=["a", "b", "c", "d"],
    )


@pytest.fixture()
def question_numeric(open_question):
    return create_question(
        question=open_question,
        question_type=Question.QuestionType.NUMERIC,
        inbound_outcome_count=4,
        range_min=10,
        range_max=13,
    )


@pytest.fixture()
def question_discrete(open_question):
    return create_question(
        question=open_question,
        question_type=Question.QuestionType.DISCRETE,
        inbound_outcome_count=4,
        range_min=9.5,
        range_max=13.5,
    )


@pytest.fixture()
def question_date(open_question):
    return create_question(
        question=open_question,
        question_type=Question.QuestionType.DATE,
        inbound_outcome_count=4,
        range_min=datetime(2020, 1, 1).timestamp(),
        range_max=datetime(2025, 1, 1).timestamp(),
    )


@pytest.fixture()
def conditional_1(question_binary, question_numeric):
    return create_conditional(
        condition=question_binary,
        condition_child=question_numeric,
        question_yes=create_question(
            question_type=Question.QuestionType.NUMERIC, title="If Yes"
        ),
        question_no=create_question(
            question_type=Question.QuestionType.NUMERIC, title="If No"
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
