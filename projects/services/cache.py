from django.core.cache import cache

from projects.models import Project
from .common import get_questions_count_for_projects, get_project_timeline_data

QUESTIONS_COUNT_CACHE_PREFIX = "project_questions_count:v1"
QUESTIONS_COUNT_CACHE_TIMEOUT = 1 * 3600  # 3 hour
PROJECT_TIMELINE_TTL_SECONDS = 5 * 360


def get_projects_questions_count_cache_key(project_id: int) -> str:
    """Generate cache key for project questions count"""
    return f"{QUESTIONS_COUNT_CACHE_PREFIX}:{project_id}"


def get_projects_questions_count_cached(
    project_ids: list[int],
) -> dict[int, int]:
    key_map: dict[int, str] = {
        pid: get_projects_questions_count_cache_key(pid) for pid in project_ids
    }
    cache_data: dict[str, int] = cache.get_many(key_map.values())
    result: dict[int, int] = {
        pid: cache_data[key] for pid, key in key_map.items() if key in cache_data
    }

    missing_ids = [pid for pid in project_ids if pid not in result]

    if missing_ids:
        db_counts = get_questions_count_for_projects(missing_ids)

        for pid in missing_ids:
            result[pid] = db_counts.get(pid, 0)

        to_cache = {key_map[pid]: result[pid] for pid in missing_ids}
        cache.set_many(to_cache, timeout=QUESTIONS_COUNT_CACHE_TIMEOUT)

    return result


def invalidate_projects_questions_count_cache(projects: list[Project]) -> None:
    """Invalidate questions count cache for multiple projects"""
    if not projects:
        return

    cache_keys = [
        get_projects_questions_count_cache_key(project.id) for project in projects
    ]
    cache.delete_many(cache_keys)


def get_project_timeline_data_cached(project: Project):
    key = f"project_timeline:v1:{project.id}"
    return cache.get_or_set(
        key,
        lambda: get_project_timeline_data(project),
        PROJECT_TIMELINE_TTL_SECONDS,
    )


def get_projects_timeline_cached(projects: list[Project]) -> dict[int, dict]:
    return {p.id: get_project_timeline_data_cached(p) for p in projects}
