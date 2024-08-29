import pytest

from questions.models import Question
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
