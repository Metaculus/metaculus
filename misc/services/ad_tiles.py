from django.core.cache import cache
from django.db.models import Q, QuerySet
from django.utils import timezone

from misc.models import AdTile
from misc.serializers import AdTileSerializer
from projects.models import Project
from projects.serializers.common import serialize_tournaments_with_counts
from projects.services.common import (
    FeedTileRule,
    get_feed_project_tiles,
    project_ids_from_urls,
)
from users.models import User

DISMISS_TTL = 60 * 60 * 24 * 90  # 90 days


def ad_tile_dismiss_id(ad: AdTile) -> str:
    return f"ad:{ad.id}"


def project_tile_dismiss_id(project_id: int, rule: FeedTileRule | None) -> str:
    # `rule` is a FeedTileRule (TextChoices -> str() is its value) or None.
    return f"project:{project_id}:{rule}"


def get_active_ad_tiles_qs() -> QuerySet[AdTile]:
    now = timezone.now()
    return (
        AdTile.objects.filter(is_active=True)
        .filter(Q(publish_at__isnull=True) | Q(publish_at__lte=now))
        .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
        .select_related("project")
        .order_by("order", "-created_at")
    )


def _dismiss_cache_key(user_id: int, dismiss_id: str) -> str:
    return f"tile:dismissed:{user_id}:{dismiss_id}"


def get_dismissed_ids(user: User, dismiss_ids: list[str]) -> set[str]:
    key_to_id = {_dismiss_cache_key(user.id, d): d for d in dismiss_ids}
    found = cache.get_many(list(key_to_id.keys()))
    return {key_to_id[k] for k in found}


def dismiss_tile(user: User, dismiss_id: str) -> None:
    cache.set(_dismiss_cache_key(user.id, dismiss_id), True, DISMISS_TTL)


def get_combined_feed_tiles(user: User | None = None) -> list[dict]:
    ads = list(get_active_ad_tiles_qs())

    # De-dup: any project an ad points at (via FK or parsed URL) suppresses its auto tile.
    ad_project_ids = {ad.project_id for ad in ads if ad.project_id}
    ad_project_ids |= project_ids_from_urls([ad.url for ad in ads if ad.url])
    project_tiles = [
        t for t in get_feed_project_tiles() if t["project_id"] not in ad_project_ids
    ]
    all_project_ids = {t["project_id"] for t in project_tiles} | {
        ad.project_id for ad in ads if ad.project_id
    }

    # Serialize project tiles with the same serializer as /projects/feed-tiles/.
    serialized_projects = serialize_tournaments_with_counts(
        Project.objects.filter(id__in=all_project_ids).select_related(
            "primary_leaderboard"
        )
    )
    projects_map = {p["id"]: p for p in serialized_projects}

    # Build the merged, ordered list: ads first, then fallback project tiles
    serialized_ads = AdTileSerializer(ads, many=True).data
    tiles = [
        {
            "type": "ad",
            "id": ad_tile_dismiss_id(ad),
            "ad": data,
            "project": projects_map.get(ad.project_id) if ad.project_id else None,
        }
        for ad, data in zip(ads, serialized_ads)
    ]
    for t in project_tiles:
        project = projects_map.get(t["project_id"])
        if not project:
            continue

        tiles.append(
            {
                **t,
                "type": "project",
                "id": project_tile_dismiss_id(t["project_id"], t["rule"]),
                "project": project,
            }
        )

    if not user:
        return tiles

    # Filter per-user dismissals in a single cache round-trip over the merged list.
    dismissed = get_dismissed_ids(user, [t["id"] for t in tiles])
    return [t for t in tiles if t["id"] not in dismissed]
