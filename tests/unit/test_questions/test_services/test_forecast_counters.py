from freezegun import freeze_time

from posts.models import Post
from questions.models import Question
from questions.services.forecasts import create_forecast_bulk
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question
from tests.unit.utils import datetime_aware


@freeze_time("2025-05-01")
def test_create_forecast_bulk_leaves_post_forecasts_count_to_task(user1, user2):
    post = factory_post(
        author=user1,
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=datetime_aware(2025, 1, 1),
            scheduled_close_time=datetime_aware(2025, 6, 1),
        ),
    )

    create_forecast_bulk(
        user=user2,
        forecasts=[{"question": post.question, "probability_yes": 0.4}],
    )

    # Refreshed by run_on_post_forecast.
    assert Post.objects.get(pk=post.pk).forecasts_count == 0
