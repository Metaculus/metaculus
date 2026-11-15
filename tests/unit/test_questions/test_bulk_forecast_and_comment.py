import json
from datetime import datetime, timezone as dt_timezone

import pytest
from rest_framework.reverse import reverse

from comments.models import Comment
from projects.models import Project
from questions.models import Forecast, Question
from tests.unit.test_posts.conftest import *  # noqa
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
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
    def test_defaults_to_requester(self, user1, user1_client, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps({"forecasts": [forecast_payload(open_question)]}),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert Forecast.objects.filter(question=open_question, author=user1).exists()

    @pytest.fixture()
    def hidden_question(self):
        question = create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=datetime(2000, 1, 1, tzinfo=dt_timezone.utc),
            scheduled_close_time=datetime(3000, 1, 1, tzinfo=dt_timezone.utc),
        )
        factory_post(
            question=question,
            default_project=factory_project(
                type=Project.ProjectTypes.TOURNAMENT, default_permission=None
            ),
        )
        return question

    def post_and_normalize(self, client, payload, hidden_id):
        response = client.post(
            URL, data=json.dumps(payload), content_type="application/json"
        )
        assert response.status_code == 400
        return response.content.decode().replace(str(hidden_id), "<id>")

    def test_hidden_question_looks_missing(self, user1_client, hidden_question):
        bodies = [
            self.post_and_normalize(
                user1_client,
                {"forecasts": [{"question": question_id, "probability_yes": 0.5}]},
                question_id,
            )
            for question_id in (hidden_question.id, hidden_question.id + 1000)
        ]

        assert bodies[0] == bodies[1]

    def test_hidden_post_looks_missing(self, user1, user1_client, hidden_question):
        hidden_post = hidden_question.get_post()
        hidden_comment = Comment.objects.create(
            author=user1, on_post=hidden_post, text="hidden"
        )
        visible_post = factory_post()

        for field, hidden_id, missing_id, extra in [
            ("on_post", hidden_post.id, hidden_post.id + 1000, {}),
            (
                "parent",
                hidden_comment.id,
                hidden_comment.id + 1000,
                {"on_post": visible_post.id},
            ),
        ]:
            bodies = [
                self.post_and_normalize(
                    user1_client,
                    {
                        "comments": [
                            {"text": "hi", "is_private": True, **extra, field: value}
                        ]
                    },
                    value,
                )
                for value in (hidden_id, missing_id)
            ]

            assert bodies[0] == bodies[1], field

    def test_unauthenticated(self, anon_client, user1, open_question):
        response = anon_client.post(
            URL,
            data=json.dumps(
                {
                    "acting_user": user1.id,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_submit_as_self_by_id(self, user1, user1_client, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {
                    "acting_user": user1.id,
                    "forecasts": [forecast_payload(open_question)],
                }
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
                    "acting_user": user1.username,
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
                {
                    "acting_user": user2.id,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_submit_as_own_bot_by_id(self, user1_client, user_bot, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {
                    "acting_user": user_bot.id,
                    "forecasts": [forecast_payload(open_question)],
                }
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
                    "acting_user": user_bot.username,
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
                {
                    "acting_user": user_bot.id,
                    "forecasts": [forecast_payload(open_question)],
                }
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
                    "acting_user": user_bot_no_owner.id,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_superuser_by_id(
        self, create_client_for_user, user_admin, user2, open_question
    ):
        staff_client = create_client_for_user(user_admin)
        response = staff_client.post(
            URL,
            data=json.dumps(
                {
                    "acting_user": user2.id,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert Forecast.objects.filter(question=open_question, author=user2).exists()

    def test_superuser_by_username(
        self, create_client_for_user, user_admin, user2, open_question
    ):
        staff_client = create_client_for_user(user_admin)
        response = staff_client.post(
            URL,
            data=json.dumps(
                {
                    "acting_user": user2.username,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert Forecast.objects.filter(question=open_question, author=user2).exists()

    def test_unknown_user_id_returns_403(self, user1_client, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {"acting_user": 999999, "forecasts": [forecast_payload(open_question)]}
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_unknown_username_returns_403(self, user1_client, open_question):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {
                    "acting_user": "does_not_exist",
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_superuser_unknown_user_id_returns_404(
        self, create_client_for_user, user_admin, open_question
    ):
        staff_client = create_client_for_user(user_admin)
        response = staff_client.post(
            URL,
            data=json.dumps(
                {
                    "acting_user": 999999,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 404

    def test_runner_as_metac_bot(
        self, metac_bot_runner_client, metac_bot, open_question
    ):
        response = metac_bot_runner_client.post(
            URL,
            data=json.dumps(
                {
                    "acting_user": metac_bot.username,
                    "forecasts": [forecast_payload(open_question)],
                    "comments": [
                        {
                            "on_post": open_question.get_post().id,
                            "text": "bot reasoning",
                            "is_private": True,
                            "included_forecast": True,
                        }
                    ],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert Forecast.objects.filter(
            question=open_question, author=metac_bot
        ).exists()
        assert Comment.objects.filter(
            author=metac_bot, on_post=open_question.get_post(), is_private=True
        ).exists()

    def test_runner_as_non_metac_account_denied(
        self, metac_bot_runner_client, user2, user_bot_no_owner, open_question
    ):
        for target in (user2, user_bot_no_owner):
            response = metac_bot_runner_client.post(
                URL,
                data=json.dumps(
                    {
                        "acting_user": target.id,
                        "forecasts": [forecast_payload(open_question)],
                    }
                ),
                content_type="application/json",
            )
            assert response.status_code == 403
            assert not Forecast.objects.filter(author=target).exists()

    def test_runner_unknown_user_id_returns_403(
        self, metac_bot_runner_client, open_question
    ):
        response = metac_bot_runner_client.post(
            URL,
            data=json.dumps(
                {
                    "acting_user": 999999,
                    "forecasts": [forecast_payload(open_question)],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_key_factors_in_bulk_comment_returns_400(
        self, user1, user1_client, open_question
    ):
        response = user1_client.post(
            URL,
            data=json.dumps(
                {
                    "acting_user": user1.id,
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
