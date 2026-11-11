from freezegun import freeze_time

from posts.models import PostSubscription
from questions.models import Question
from questions.services.forecasts import create_forecast_bulk
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question
from tests.unit.utils import datetime_aware
from users.services.bots_management import create_bot


def _forecast_on_new_post(author, forecaster):
    post = factory_post(
        author=author,
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=datetime_aware(2025, 1, 1),
            scheduled_close_time=datetime_aware(2025, 6, 1),
        ),
    )
    create_forecast_bulk(
        user=forecaster,
        forecasts=[{"question": post.question, "probability_yes": 0.4}],
    )


@freeze_time("2025-05-01")
def test_user_follows_forecasted_post(user1, user2):
    _forecast_on_new_post(user1, user2)

    assert PostSubscription.objects.filter(user=user2).exists()


@freeze_time("2025-05-01")
def test_bot_does_not_follow_forecasted_post(user1):
    bot = create_bot(bot_owner=user1, username="user1-bot")

    _forecast_on_new_post(user1, bot)

    assert not PostSubscription.objects.filter(user=bot).exists()
