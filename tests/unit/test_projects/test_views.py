from rest_framework import status
from rest_framework.reverse import reverse

from projects.permissions import ObjectPermission
from projects.services.common import get_project_permission_for_user
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_users.factories import factory_user


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
