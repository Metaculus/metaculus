from freezegun import freeze_time

from notifications.models import Notification
from questions.models import Question
from questions.services.common import create_question
from questions import tasks as question_tasks
from questions.tasks import (
    resolve_question_and_send_notifications,
    send_resolution_notifications,
)
from scoring.constants import ScoreTypes
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import factory_forecast
from tests.unit.test_scoring.factories import factory_score
from tests.unit.utils import datetime_aware
from users.services.bots_management import create_bot


@freeze_time("2025-01-10")
def test_resolve_question_and_send_notifications(mocker, user1):
    mocker.patch("questions.services.lifecycle.score_question")
    mocker.patch("questions.services.lifecycle.rebuild_question_aggregations")

    question_binary = create_question(
        title="Question Title",
        type=Question.QuestionType.BINARY,
        open_time=datetime_aware(2025, 1, 1),
        scheduled_close_time=datetime_aware(2025, 1, 9),
        actual_close_time=datetime_aware(2025, 1, 9),
        resolution="yes",
    )
    factory_post(question=question_binary)

    factory_forecast(
        author=user1,
        question=question_binary,
        start_time=datetime_aware(2025, 1, 1),
        end_time=datetime_aware(2025, 1, 5),
    )
    factory_forecast(
        author=user1,
        question=question_binary,
        start_time=datetime_aware(2025, 1, 5),
        end_time=datetime_aware(2025, 1, 8),
    )
    factory_forecast(
        author=user1,
        question=question_binary,
        start_time=datetime_aware(2025, 1, 9, 10),
        end_time=None,
    )

    factory_score(
        question=question_binary,
        user=user1,
        score_type=ScoreTypes.PEER,
        score=10,
        coverage=0.75,
    )

    resolve_question_and_send_notifications(question_id=question_binary.id)

    notification = Notification.objects.get(
        recipient=user1, type="predicted_question_resolved"
    )

    assert notification.params["baseline_score"] == 0
    assert notification.params["coverage"] == 0.75
    assert notification.params["peer_score"] == 10.0
    assert notification.params["forecasts_count"] == 2
    assert notification.params["resolution"] == "yes"


@freeze_time("2025-01-10")
def test_send_resolution_notifications_skips_bots(mocker, user1):
    links = mocker.spy(question_tasks, "get_outbound_question_links")
    bot = create_bot(bot_owner=user1, username="user1-bot")
    question = create_question(
        title="Question Title",
        type=Question.QuestionType.BINARY,
        open_time=datetime_aware(2025, 1, 1),
        scheduled_close_time=datetime_aware(2025, 1, 9),
        actual_close_time=datetime_aware(2025, 1, 9),
        resolution="yes",
    )
    factory_post(question=question)
    for user in (user1, bot):
        factory_score(question=question, user=user, score_type=ScoreTypes.PEER)

    send_resolution_notifications(question)

    assert [call.args[1] for call in links.call_args_list] == [user1]
