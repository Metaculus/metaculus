import pytest
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APIClient

from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services.common import get_project_permission_for_user
from scoring.constants import ExclusionStatuses
from tests.unit.test_projects.factories import factory_project
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
