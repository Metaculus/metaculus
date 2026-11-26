from datetime import timedelta

import pytest
from django.utils import timezone

from posts.services.common import compute_sorting_divergence
from questions.models import AggregateForecast, Question
from questions.services.movement import compute_question_movement
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question
from utils.the_math.measures import prediction_difference_for_sorting


def test_movement_and_divergence_read_the_stored_cp(user1, user2):
    now = timezone.now()
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        open_time=now - timedelta(days=30),
        scheduled_close_time=now + timedelta(days=30),
    )
    post = factory_post(question=question)
    for author, probability_yes in [(user1, 0.2), (user2, 0.8)]:
        question.user_forecasts.create(
            author=author,
            probability_yes=probability_yes,
            start_time=now - timedelta(days=10),
        )
    # Stored values that a recompute from the forecasts above can't give
    for start_time, end_time, forecast_values in [
        (now - timedelta(days=10), now - timedelta(days=2), [0.7, 0.3]),
        (now - timedelta(days=2), None, [0.4, 0.6]),
    ]:
        AggregateForecast.objects.create(
            question=question,
            method=question.default_aggregation_method,
            start_time=start_time,
            end_time=end_time,
            forecast_values=forecast_values,
        )

    assert compute_question_movement(question) == pytest.approx(
        prediction_difference_for_sorting([0.4, 0.6], [0.7, 0.3], question.type)
    )
    assert compute_sorting_divergence(post) == {
        user.id: pytest.approx(
            prediction_difference_for_sorting(values, [0.4, 0.6], question.type)
        )
        for user, values in [(user1, [0.8, 0.2]), (user2, [0.2, 0.8])]
    }
