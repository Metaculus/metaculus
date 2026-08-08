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


def test_dismiss_endpoint(user1_client):
    cache.clear()
    get_feed_project_tiles.clear_cache()
    ad = factory_ad_tile(title="Promo")

    def shown_ids():
        return [t["id"] for t in user1_client.get(reverse("ad-tiles")).json()]

    # Unknown id: accepted (201) but nothing is dismissed.
    unknown = reverse("ad-tiles-dismiss", kwargs={"dismiss_id": "ad:999999"})
    assert user1_client.post(unknown).status_code == status.HTTP_201_CREATED
    assert f"ad:{ad.id}" in shown_ids()

    # Real id: accepted (201) and removed on the next fetch.
    known = reverse("ad-tiles-dismiss", kwargs={"dismiss_id": f"ad:{ad.id}"})
    assert user1_client.post(known).status_code == status.HTTP_201_CREATED
    assert f"ad:{ad.id}" not in shown_ids()
    get_feed_project_tiles.clear_cache()
