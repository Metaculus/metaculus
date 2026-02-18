from datetime import timedelta

from questions.models import Forecast, Question
from questions.types import AggregationMethod
from scoring.constants import ScoreTypes
from scoring.score_math import evaluate_question
from users.models import User

from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question
from tests.unit.utils import datetime_aware


def create_binary_question_with_forecasts(
    q_kwargs=None,
    post_kwargs=None,
    forecasts_data=None,
):
    q_kwargs = {
        "question_type": Question.QuestionType.BINARY,
        "open_time": datetime_aware(2025, 1, 1),
        "scheduled_close_time": datetime_aware(2026, 1, 1),
        **(q_kwargs if q_kwargs else {}),
    }
    question = create_question(**q_kwargs)
    question.post = factory_post(question=question, **(post_kwargs or {}))
    question.save(update_fields=["post"])

    forecasts_data = forecasts_data or []
    for f_kwargs in forecasts_data:
        username = f_kwargs.pop("username")
        user, _ = User.objects.get_or_create(username=username)
        f_kwargs["author"] = user
        Forecast.objects.create(question=question, **f_kwargs)

    return question


def test_preopen_binary_single_user_score_parity():
    """
    Tests that a forecast with a start_time before the question's open_time doesn't
    affect scores compared to a forecast with a start_time at the question's open_time.
    """
    open_time = datetime_aware(2025, 1, 1)
    actual_close_time = datetime_aware(2026, 1, 1)

    control_question = create_binary_question_with_forecasts(
        q_kwargs={
            "open_time": open_time,
            "actual_close_time": actual_close_time,
        },
        forecasts_data=[
            {
                "username": "user_1",
                "probability_yes": 0.7,
                "start_time": open_time,
            },
        ],
    )
    control_scores = evaluate_question(
        control_question,
        resolution="yes",
        score_types=[ScoreTypes.BASELINE],
    )

    condition_question = create_binary_question_with_forecasts(
        q_kwargs={
            "open_time": open_time,
            "actual_close_time": actual_close_time,
        },
        forecasts_data=[
            {
                "username": "user_1",
                "probability_yes": 0.7,
                "start_time": open_time - timedelta(days=30),
            },
        ],
    )
    condition_scores = evaluate_question(
        condition_question,
        resolution="yes",
        score_types=[ScoreTypes.BASELINE],
    )

    for control_score, condition_score in zip(control_scores, condition_scores):
        assert control_score.user_id == condition_score.user_id
        assert control_score.score == condition_score.score
        assert control_score.coverage == condition_score.coverage


def test_preopen_binary_multiple_user_score_parity():
    """
    Tests that a forecast with a start_time before the question's open_time doesn't
    affect scores compared to a forecast with a start_time at the question's open_time.
    """
    open_time = datetime_aware(2025, 1, 1)
    actual_close_time = datetime_aware(2026, 1, 1)

    control_question = create_binary_question_with_forecasts(
        q_kwargs={
            "open_time": open_time,
            "actual_close_time": actual_close_time,
        },
        forecasts_data=[
            {
                "username": "user_1",
                "probability_yes": 0.7,
                "start_time": open_time,  # at launch
            },
            {
                "username": "user_2",
                "probability_yes": 0.5,
                "start_time": open_time,  # at launch
            },
            {
                "username": "user_3",
                "probability_yes": 0.3,
                "start_time": open_time + timedelta(days=30),  # after launch
            },
        ],
    )
    control_scores = evaluate_question(
        control_question,
        resolution="yes",
        aggregation_methods=[AggregationMethod.UNWEIGHTED],
        score_types=[ScoreTypes.PEER],
    )

    condition_question = create_binary_question_with_forecasts(
        q_kwargs={
            "open_time": open_time,
            "actual_close_time": actual_close_time,
        },
        forecasts_data=[
            {
                "username": "user_1",
                "probability_yes": 0.7,
                "start_time": open_time - timedelta(days=30),  # before launch
            },
            {
                "username": "user_2",
                "probability_yes": 0.5,
                "start_time": open_time - timedelta(days=30),  # before launch
            },
            {
                "username": "user_3",
                "probability_yes": 0.3,
                "start_time": open_time + timedelta(days=30),  # after launch
            },
        ],
    )
    condition_scores = evaluate_question(
        condition_question,
        resolution="yes",
        aggregation_methods=[AggregationMethod.UNWEIGHTED],
        score_types=[ScoreTypes.PEER],
    )

    for control_score, condition_score in zip(control_scores, condition_scores):
        assert control_score.user_id == condition_score.user_id
        assert control_score.score == condition_score.score
        assert control_score.coverage == condition_score.coverage
