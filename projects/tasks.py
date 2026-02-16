import dramatiq

from projects.services.common import get_feed_project_tiles


@dramatiq.actor
def warm_cache_feed_project_tiles() -> None:
    get_feed_project_tiles.refresh_cache()
