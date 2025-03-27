import pytest
from datetime import datetime, timezone as dt_timezone

from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_conditional, create_question


@pytest.fixture()
def question_binary():
    return create_question(question_type=Question.QuestionType.BINARY)


@pytest.fixture()
def question_numeric():
    return create_question(question_type=Question.QuestionType.NUMERIC)


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
