from rest_framework.reverse import reverse

from projects.models import ProjectUserPermission
from projects.permissions import ObjectPermission
from .fixtures import *  # noqa


def test_communities_list(
    user1_client, community_public, community_private, community_unlisted
):
    url = reverse("communities-list")

    response = user1_client.get(url)
    assert response.status_code == 200

    assert len(response.data["results"]) == 1
    community = response.data["results"][0]

    assert community["id"] == community_public.pk
    assert community["type"] == "community"
    assert community["default_permission"] == "forecaster"


def test_communities_list__filter_ids(
    user1_client, community_unlisted
):
    url = reverse("communities-list")

    response = user1_client.get(f"{url}?ids={community_unlisted.id}")
    assert response.status_code == 200

    assert len(response.data["results"]) == 1
    community = response.data["results"][0]

    assert community["id"] == community_unlisted.pk
    assert community["type"] == "community"


def test_communities_detail(
    user1_client, community_public, community_private, community_unlisted
):
    url = reverse("community-detail", kwargs={"slug": community_public.slug})
    response = user1_client.get(url)
    assert response.status_code == 200

    url = reverse("community-detail", kwargs={"slug": community_unlisted.slug})
    response = user1_client.get(url)
    assert response.status_code == 200

    url = reverse("community-detail", kwargs={"slug": community_private.slug})
    response = user1_client.get(url)
    assert response.status_code == 404


def test_communities_update(user1, user1_client, community_public):
    url = reverse("community-update", kwargs={"pk": community_public.pk})

    response = user1_client.put(url, data={"name": "Updated"})
    assert response.status_code == 403

    ProjectUserPermission.objects.create(
        user=user1, project=community_public, permission=ObjectPermission.ADMIN
    )

    response = user1_client.put(url, data={"name": "Updated"})
    assert response.status_code == 200
    assert response.data["name"] == "Updated"
