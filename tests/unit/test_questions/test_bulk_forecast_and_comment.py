import json
from datetime import datetime, timezone as dt_timezone

import pytest
from rest_framework.reverse import reverse

from questions.models import Forecast, Question
from tests.unit.test_posts.conftest import *  # noqa
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import create_question
from users.models import User

URL = reverse("bulk-forecast-comment")


def forecast_payload(question, **kwargs):
    return {"question": question.id, "probability_yes": 0.6, **kwargs}


@pytest.fixture()
def open_question():
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        open_time=datetime(2000, 1, 1, tzinfo=dt_timezone.utc),
        scheduled_close_time=datetime(3000, 1, 1, tzinfo=dt_timezone.utc),
    )
    factory_post(question=question)
    return question


@pytest.fixture()
def user_bot(user1: User) -> User:
    return User.objects.create(
        email="bot@metaculus.com",
        username="bot_user",
        is_bot=True,
        bot_owner=user1,
    )


@pytest.fixture()
def user_bot_no_owner() -> User:
    return User.objects.create(
        email="orphan_bot@metaculus.com",
        username="orphan_bot",
        is_bot=True,
        bot_owner=None,
    )


class TestBulkForecastAndComment:
    def test_requires_user_id_or_username(self, user1_client, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps({"forecasts": [forecast_payload(open_question)]}),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_unauthenticated(self, anon_client, user1, open_question):
        response = anon_client.post(
            URL,
            data=json.dumps(
                {"user_id": user1.id, "forecasts": [forecast_payload(open_question)]}
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_submit_as_self_by_user_id(self, user1, user1_client, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {"user_id": user1.id, "forecasts": [forecast_payload(open_question)]}
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert Forecast.objects.filter(question=open_question, author=user1).exists()

    def test_submit_as_self_by_username(self, user1, user1_client, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {
                    "username": user1.username,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert Forecast.objects.filter(question=open_question, author=user1).exists()

    def test_submit_as_other_user_denied(self, user1_client, user2, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {"user_id": user2.id, "forecasts": [forecast_payload(open_question)]}
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_submit_as_own_bot_by_user_id(self, user1_client, user_bot, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {"user_id": user_bot.id, "forecasts": [forecast_payload(open_question)]}
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert Forecast.objects.filter(question=open_question, author=user_bot).exists()

    def test_submit_as_own_bot_by_username(self, user1_client, user_bot, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {
                    "username": user_bot.username,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert Forecast.objects.filter(question=open_question, author=user_bot).exists()

    def test_submit_as_other_users_bot_denied(
        self, user2_client, user_bot, open_question
    ):
        # user_bot is owned by user1, not user2
        response = user2_client.post(
            URL,
            data=json.dumps(
                {"user_id": user_bot.id, "forecasts": [forecast_payload(open_question)]}
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_submit_as_bot_with_no_owner_denied(
        self, user1_client, user_bot_no_owner, open_question
    ):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {
                    "user_id": user_bot_no_owner.id,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_superuser_override_by_user_id(
        self, create_client_for_user, user_admin, user2, open_question
    ):
        staff_client = create_client_for_user(user_admin)
        response = staff_client.post(
            URL,
            data=json.dumps(
                {
                    "user_id": user2.id,
                    "is_staff_override": True,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert Forecast.objects.filter(question=open_question, author=user2).exists()

    def test_superuser_override_by_username(
        self, create_client_for_user, user_admin, user2, open_question
    ):
        staff_client = create_client_for_user(user_admin)
        response = staff_client.post(
            URL,
            data=json.dumps(
                {
                    "username": user2.username,
                    "is_staff_override": True,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert Forecast.objects.filter(question=open_question, author=user2).exists()

    def test_non_superuser_cannot_use_staff_override(
        self, user1_client, user1, user2, open_question
    ):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {
                    "user_id": user2.id,
                    "is_staff_override": True,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_unknown_user_id_returns_403(self, user1_client, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {"user_id": 999999, "forecasts": [forecast_payload(open_question)]}
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_unknown_username_returns_403(self, user1_client, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {
                    "username": "does_not_exist",
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_superuser_override_unknown_user_id_returns_404(
        self, create_client_for_user, user_admin, open_question
    ):
        staff_client = create_client_for_user(user_admin)
        response = staff_client.post(
            URL,
            data=json.dumps(
                {
                    "user_id": 999999,
                    "is_staff_override": True,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 404

    def test_key_factors_in_bulk_comment_returns_400(
        self, user1, user1_client, open_question
    ):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {
                    "user_id": user1.id,
                    "comments": [
                        {
                            "on_post": open_question.get_post().id,
                            "text": "test comment",
                            "is_private": True,
                            "key_factors": [
                                {"text": "some factor", "is_positive": True}
                            ],
                        }
                    ],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 400
