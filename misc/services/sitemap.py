from posts.services.sitemap import get_sitemap_posts
from projects.services.sitemap import get_sitemap_projects
from utils.cache import cache_get_or_set

SITEMAP_CACHE_KEY = "sitemap:v1"
SITEMAP_CACHE_TIMEOUT = 6 * 3600


def get_sitemap_payload() -> dict:
    # Data only; the frontend builds URLs and decides indexability so the
    # sitemap stays consistent with each page's canonical.
    return cache_get_or_set(
        SITEMAP_CACHE_KEY,
        lambda: {
            "posts": get_sitemap_posts(),
            "projects": get_sitemap_projects(),
        },
        timeout=SITEMAP_CACHE_TIMEOUT,
    )
