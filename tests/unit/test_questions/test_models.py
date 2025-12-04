import pytest

from questions.models import Question, Forecast
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question, factory_forecast
from tests.unit.utils import datetime_aware


@pytest.mark.parametrize(
    "start_time,end_time,actual_close_time,include",
    [
        # After close time
        [datetime_aware(2025, 3, 1), None, None, False],
        # End time before opening
        [datetime_aware(2024, 12, 30), datetime_aware(2024, 12, 31), None, False],
        # Start time before open, end time after closure
        # Should be legit
        [datetime_aware(2024, 12, 31), datetime_aware(2025, 3, 1), None, True],
        # Just a normal forecast
        [datetime_aware(2025, 1, 15), None, None, True],
        # Just a normal forecast with end date after closure date
        [datetime_aware(2025, 1, 15), datetime_aware(2025, 3, 1), None, True],
        # Forecast after actual close date
        [datetime_aware(2025, 1, 15), None, datetime_aware(2025, 1, 14), False],
    ],
)
def test_filter_within_question_period(
    user1, conditional_1, start_time, end_time, actual_close_time, include
):
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        open_time=datetime_aware(2025, 1, 1),
        scheduled_close_time=datetime_aware(2025, 2, 1),
        actual_close_time=actual_close_time,
    )
    factory_post(author=user1, question=question)

    f1 = factory_forecast(
        question=question, author=user1, start_time=start_time, end_time=end_time
    )

    assert (
        Forecast.objects.filter(id=f1.id).filter_within_question_period().exists()
        == include
    )


def test_initialize_multiple_choice_question():
    question = create_question(
        question_type=Question.QuestionType.MULTIPLE_CHOICE,
        options=["a", "b", "other"],
    )
    question.save()
    assert (
        question.options_history and question.options_history[0][1] == question.options
    )
