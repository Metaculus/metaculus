import json
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.reverse import reverse

from projects.models import Project
from projects.permissions import ObjectPermission
from questions.models import Question
from tests.unit.test_posts.conftest import *  # noqa
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import create_question

URL = reverse("bulk-forecast-read")


def make_question(**post_kwargs) -> Question:
    question = create_question(question_type=Question.QuestionType.BINARY)
    factory_post(question=question, **post_kwargs)
    return question


def make_forecast(question: Question, author, probability_yes=0.5, **kwargs):
    kwargs.setdefault("start_time", timezone.now() - timedelta(hours=1))
    return question.user_forecasts.create(
        author=author, probability_yes=probability_yes, **kwargs
    )


def results_by_question(response) -> dict[int, list[dict]]:
    return {r["question_id"]: r["forecasts"] for r in response.data["results"]}


@pytest.fixture()
def tournament(metac_bot) -> Project:
    """
    Private tournament only the metac bot can view.
    """

    return factory_project(
        type=Project.ProjectTypes.TOURNAMENT,
        slug="bot-tournament",
        default_permission=None,
        override_permissions={metac_bot.id: ObjectPermission.FORECASTER},
    )


class TestBulkForecastRead:
    def test_own_forecasts_by_question_ids(self, user1, user2, user1_client):
        q1 = make_question()
        q2 = make_question()
        now = timezone.now()
        q1.user_forecasts.create(
            author=user1, probability_yes=0.3, start_time=now - timedelta(days=2)
        )
        q1.user_forecasts.create(
            author=user1, probability_yes=0.7, start_time=now - timedelta(days=1)
        )
        # Other users' forecasts are never returned
        q1.user_forecasts.create(author=user2, probability_yes=0.9, start_time=now)

        response = user1_client.get(URL, {"question_ids": [q1.id, q2.id]})

        assert response.status_code == 200
        results = results_by_question(response)
        assert set(results) == {q1.id, q2.id}
        assert [f["forecast_values"][1] for f in results[q1.id]] == [0.3, 0.7]
        assert all(f["author_id"] == user1.id for f in results[q1.id])
        assert results[q2.id] == []

    def test_post_body(self, user1, user1_client, metac_bot_runner_client, metac_bot):
        question = make_question()
        make_forecast(question, user1, 0.4)

        response = user1_client.post(
            URL,
            data=json.dumps({"question_ids": [question.id]}),
            content_type="application/json",
        )

        assert response.status_code == 200
        assert len(results_by_question(response)[question.id]) == 1

        # acting_user is read from the body too
        response = metac_bot_runner_client.post(
            URL,
            data=json.dumps(
                {"question_ids": [question.id], "acting_user": metac_bot.username}
            ),
            content_type="application/json",
        )

        assert response.status_code == 200
        assert results_by_question(response)[question.id] == []

    def test_omits_questions_not_visible_to_acting_user(self, user1_client, tournament):
        public = make_question()
        private = make_question(default_project=tournament)

        response = user1_client.get(URL, {"question_ids": [public.id, private.id]})

        assert response.status_code == 200
        assert set(results_by_question(response)) == {public.id}

    def test_missing_and_forbidden_questions_look_the_same(
        self, user1_client, tournament
    ):
        public = make_question()
        private = make_question(default_project=tournament)
        missing_id = private.id + 1000

        responses = [
            user1_client.get(URL, {"question_ids": [public.id, question_id]})
            for question_id in (private.id, missing_id)
        ]

        assert [r.status_code for r in responses] == [200, 200]
        assert responses[0].json() == responses[1].json()

    def test_missing_and_forbidden_projects_look_the_same(
        self, user1_client, tournament
    ):
        responses = [
            user1_client.get(URL, {"project": project})
            for project in (tournament.id, tournament.slug, 999999, "does-not-exist")
        ]

        assert {r.status_code for r in responses} == {404}
        assert len({json.dumps(r.json()) for r in responses}) == 1

    @pytest.mark.parametrize("lookup", ["id", "slug"])
    def test_project_as_metac_bot(
        self, lookup, metac_bot_runner_client, metac_bot, tournament
    ):
        in_project = make_question(default_project=tournament)
        make_question()
        make_forecast(in_project, metac_bot, 0.6)

        response = metac_bot_runner_client.get(
            URL,
            {"project": getattr(tournament, lookup), "acting_user": metac_bot.id},
        )

        assert response.status_code == 200
        results = results_by_question(response)
        assert set(results) == {in_project.id}
        assert results[in_project.id][0]["author_id"] == metac_bot.id

    def test_acting_as_other_account_denied(
        self, user1_client, metac_bot_runner_client, user2, metac_bot
    ):
        question = make_question()

        response = user1_client.get(
            URL, {"question_ids": [question.id], "acting_user": metac_bot.id}
        )
        assert response.status_code == 403

        response = metac_bot_runner_client.get(
            URL, {"question_ids": [question.id], "acting_user": user2.id}
        )
        assert response.status_code == 403

    def test_superuser_can_read_as_any_account(self, user_admin_client, user2):
        question = make_question()
        make_forecast(question, user2, 0.4)

        response = user_admin_client.get(
            URL, {"question_ids": [question.id], "acting_user": user2.username}
        )

        assert response.status_code == 200
        assert results_by_question(response)[question.id][0]["author_id"] == user2.id

    def test_unauthenticated(self, anon_client):
        response = anon_client.get(URL, {"question_ids": [make_question().id]})

        assert response.status_code == 403

    @pytest.mark.parametrize(
        "params",
        [
            {},
            {"question_ids": [1], "project": "1"},
        ],
    )
    def test_requires_exactly_one_selector(self, params, user1_client):
        response = user1_client.get(URL, params)

        assert response.status_code == 400
