import pytest
from django.core.cache import cache
from rest_framework import status
from rest_framework.reverse import reverse

from projects.services.common import get_feed_project_tiles
from tests.unit.test_misc.factories import factory_ad_tile


@pytest.mark.parametrize("client_name", ["user1_client", "anon_client"])
def test_ad_tiles_endpoint_returns_active_ad(client_name, request):
    cache.clear()
    get_feed_project_tiles.clear_cache()
    client = request.getfixturevalue(client_name)
    ad = factory_ad_tile(title="Promo", url="https://metaculus.com/x/")

    resp = client.get(reverse("ad-tiles"))

    assert resp.status_code == status.HTTP_200_OK
    ad_tiles = [t for t in resp.json() if t["type"] == "ad"]
    assert ad_tiles[0]["id"] == f"ad:{ad.id}"
    assert ad_tiles[0]["ad"]["title"] == "Promo"
    get_feed_project_tiles.clear_cache()


def test_dismiss_endpoint_authed_hides_tile(user1_client):
    cache.clear()
    get_feed_project_tiles.clear_cache()
    ad = factory_ad_tile(title="Promo")

    url = reverse("ad-tiles-dismiss", kwargs={"dismiss_id": f"ad:{ad.id}"})
    resp = user1_client.post(url)
    assert resp.status_code == status.HTTP_201_CREATED

    follow_up = user1_client.get(reverse("ad-tiles"))
    assert all(t["id"] != f"ad:{ad.id}" for t in follow_up.json())
    get_feed_project_tiles.clear_cache()


def test_dismiss_endpoint_requires_auth(anon_client):
    url = reverse("ad-tiles-dismiss", kwargs={"dismiss_id": "ad:1"})
    resp = anon_client.post(url)
    assert resp.status_code in (
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    )
