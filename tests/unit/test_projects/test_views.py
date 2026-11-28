from datetime import timedelta

import pytest
from django.core.cache import cache
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone, translation
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APIClient

from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services.common import get_project_permission_for_user
from questions.models import Question
from scoring.constants import ExclusionStatuses
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question
from tests.unit.test_users.factories import factory_user


class TestProjectCreate:
    @pytest.fixture
    def staff_client(self, create_client_for_user) -> APIClient:
        return create_client_for_user(factory_user(username="staff", is_staff=True))

    def create_project(self, client: APIClient, **extra_data):
        return client.post(
            reverse("project-create"),
            {
                "type": Project.ProjectTypes.QUESTION_SERIES,
                "name": "MiniBench",
                "slug": "minibench",
                "leaderboard_score_type": "spot_peer_tournament",
                **extra_data,
            },
        )

    def test_sets_leaderboard_bot_exclusion_status(self, staff_client):
        response = self.create_project(
            staff_client, leaderboard_bot_exclusion_status=ExclusionStatuses.INCLUDE
        )

        assert response.status_code == status.HTTP_200_OK
        leaderboard = Project.objects.get(pk=response.data["id"]).primary_leaderboard
        assert leaderboard.bot_exclusion_status == ExclusionStatuses.INCLUDE
        assert leaderboard.score_type == "spot_peer_tournament"

        leaderboards_response = staff_client.get(
            reverse("project-leaderboard", kwargs={"project_id": response.data["id"]}),
            {"primary_only": True},
        )
        assert leaderboards_response.data[0]["bot_exclusion_status"] == (
            ExclusionStatuses.INCLUDE
        )
        assert leaderboards_response.data[0]["human_exclusion_status"] == (
            ExclusionStatuses.INCLUDE
        )

    def test_keeps_default_bot_exclusion_status_when_not_given(self, staff_client):
        response = self.create_project(staff_client)

        assert response.status_code == status.HTTP_200_OK
        leaderboard = Project.objects.get(pk=response.data["id"]).primary_leaderboard
        assert leaderboard.bot_exclusion_status == ExclusionStatuses.EXCLUDE_AND_SHOW

    def test_rejects_invalid_bot_exclusion_status(self, staff_client):
        response = self.create_project(
            staff_client, leaderboard_bot_exclusion_status=99
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not Project.objects.filter(slug="minibench").exists()


class TestInviteUsersToPrivateProject:
    def test_happy_path(self, user1, user1_client):
        user2 = factory_user(username="user2")
        user3 = factory_user(username="user3")

        project = factory_project(
            default_permission=None,
            override_permissions={user1.id: ObjectPermission.ADMIN},
        )
        url = reverse("project-members-invite", kwargs={"project_id": project.id})

        response = user1_client.post(
            url,
            {
                "usernames": [
                    "user3",
                    "user2",
                    # Invalid username
                    "user-404",
                ]
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        response = user1_client.post(
            url,
            {
                "usernames": [
                    "user3",
                    "user2",
                ]
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

        assert (
            get_project_permission_for_user(project, user=user2)
            == ObjectPermission.FORECASTER
        )
        assert (
            get_project_permission_for_user(project, user=user3)
            == ObjectPermission.FORECASTER
        )
        assert (
            get_project_permission_for_user(project, user=user1)
            == ObjectPermission.ADMIN
        )

    def test_no_access(self, user1, user1_client):
        project = factory_project(
            default_permission=None,
            override_permissions={user1.id: ObjectPermission.FORECASTER},
        )
        url = reverse("project-members-invite", kwargs={"project_id": project.id})

        response = user1_client.post(
            url,
            {
                "usernames": [
                    "user2",
                ]
            },
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


def test_tournament_detail_timeline_skips_full_question_rows(anon_client, user1):
    project = factory_project(type=Project.ProjectTypes.TOURNAMENT, slug="egress-cup")
    factory_post(
        author=user1,
        default_project=project,
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            scheduled_close_time=timezone.now() + timedelta(days=1),
            scheduled_resolve_time=timezone.now() + timedelta(days=2),
        ),
    )

    with CaptureQueriesContext(connection) as ctx:
        response = anon_client.get(f"/api/projects/tournaments/{project.slug}/")

    assert response.data["timeline"]["all_questions_closed"] is False
    assert not [
        q
        for q in ctx.captured_queries
        if '"questions_question"."description' in q["sql"]
    ]


@pytest.mark.parametrize("language", ["en", "es", "cs", "zh-TW"])
def test_tournaments_list_skips_unused_translation_columns(
    anon_client, mocker, language
):
    factory_project(
        type=Project.ProjectTypes.TOURNAMENT,
        default_permission=ObjectPermission.FORECASTER,
        content_original_lang="en",
        name_original="T",
        name_es="T es",
        description_original="D",
        description_cs="D cs",
        description_zh_TW="D zh-TW",
        subtitle_original="S",
        subtitle_pt="S pt",
    )
    url = "/api/projects/tournaments/"

    cache.clear()
    with translation.override(language), CaptureQueriesContext(connection) as ctx:
        response = anon_client.get(url, HTTP_ACCEPT_LANGUAGE=language)

    list_sql = next(
        q["sql"] for q in ctx.captured_queries if 'FROM "projects_project"' in q["sql"]
    )
    assert '"projects_project"."description",' not in list_sql

    mocker.patch(
        "projects.views.common.defer_unused_translations",
        side_effect=lambda queryset, *related: queryset,
    )
    cache.clear()
    with translation.override(language), CaptureQueriesContext(connection) as full_ctx:
        expected = anon_client.get(url, HTTP_ACCEPT_LANGUAGE=language)

    assert len(response.json()) == 1
    assert response.json() == expected.json()
    assert len(ctx.captured_queries) == len(full_ctx.captured_queries)
