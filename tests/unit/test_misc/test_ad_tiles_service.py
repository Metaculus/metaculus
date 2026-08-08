from datetime import timedelta

import pytest
from django.core.cache import cache
from django.utils import timezone

from misc.services.ad_tiles import (
    ad_tile_dismiss_id,
    dismiss_tile,
    get_active_ad_tiles_qs,
    get_combined_feed_tiles,
    get_dismissed_ids,
)
from projects.models import Project
from projects.services.common import get_feed_project_tiles
from tests.unit.test_misc.factories import factory_ad_tile
from tests.unit.test_projects.factories import factory_project


def test_get_active_ad_tiles_qs_filters_inactive_and_out_of_window():
    now = timezone.now()
    active = factory_ad_tile(is_active=True)
    factory_ad_tile(is_active=False)
    factory_ad_tile(is_active=True, publish_at=now + timedelta(days=1))
    factory_ad_tile(is_active=True, expires_at=now - timedelta(days=1))

    ids = set(get_active_ad_tiles_qs().values_list("id", flat=True))
    assert ids == {active.id}


def test_dismiss_and_get_dismissed_ids(user1):
    cache.clear()
    dismiss_tile(user1, "ad:5")
    assert get_dismissed_ids(user1, ["ad:5", "ad:6"]) == {"ad:5"}


def test_combined_tiles_serializes_ads_in_order(user1):
    cache.clear()
    get_feed_project_tiles.clear_cache()
    factory_ad_tile(title="Second", url="https://metaculus.com/2/", order=2)
    first = factory_ad_tile(title="First", url="https://metaculus.com/1/", order=1)

    tiles = get_combined_feed_tiles(user1)
    ad_tiles = [t for t in tiles if t["type"] == "ad"]

    assert [t["ad"]["title"] for t in ad_tiles] == ["First", "Second"]
    assert ad_tiles[0]["id"] == f"ad:{first.id}"
    assert ad_tiles[0]["ad"]["url"] == "https://metaculus.com/1/"
    get_feed_project_tiles.clear_cache()


@pytest.mark.parametrize("link", ["fk", "url"])
def test_combined_tiles_dedup_promoted_project(user1, link):
    cache.clear()
    get_feed_project_tiles.clear_cache()
    now = timezone.now()
    project = factory_project(
        type=Project.ProjectTypes.TOURNAMENT, slug="cup-2026", start_date=now
    )
    if link == "fk":
        factory_ad_tile(title="Promo", project=project)
    else:
        factory_ad_tile(
            title="Promo",
            project=None,
            url="https://metaculus.com/tournament/cup-2026/",
        )

    tiles = get_combined_feed_tiles(user1)

    assert any(t["type"] == "ad" for t in tiles)
    assert not any(
        t["type"] == "project" and t["project"]["id"] == project.id for t in tiles
    )
    get_feed_project_tiles.clear_cache()


def test_combined_tiles_project_tile_shape_and_dismissal(user1):
    cache.clear()
    get_feed_project_tiles.clear_cache()
    now = timezone.now()
    project = factory_project(type=Project.ProjectTypes.TOURNAMENT, start_date=now)

    tiles = get_combined_feed_tiles(user1)
    project_tiles = [t for t in tiles if t["type"] == "project"]
    assert len(project_tiles) == 1
    pt = project_tiles[0]
    assert set(pt.keys()) == {
        "type",
        "id",
        "project",
        "project_id",
        "rule",
        "recently_opened_questions",
        "recently_resolved_questions",
        "all_questions_resolved",
        "project_resolution_date",
    }
    assert pt["project"]["id"] == project.id
    assert pt["project_id"] == project.id

    # Dismissing the tile by its id removes it on the next call.
    dismiss_tile(user1, pt["id"])
    assert all(t["id"] != pt["id"] for t in get_combined_feed_tiles(user1))
    get_feed_project_tiles.clear_cache()


def test_combined_tiles_excludes_dismissed_ad(user1):
    cache.clear()
    get_feed_project_tiles.clear_cache()
    ad = factory_ad_tile(title="Promo")
    dismiss_tile(user1, ad_tile_dismiss_id(ad))

    tiles = get_combined_feed_tiles(user1)

    assert all(t["id"] != ad_tile_dismiss_id(ad) for t in tiles)
    get_feed_project_tiles.clear_cache()
