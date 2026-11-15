from projects.models import Project
from projects.services.common import get_projects_qs


def get_sitemap_projects() -> list[dict]:
    """
    Publicly indexable project pages (tournaments, question series, indexes).

    Visibility mirrors tournaments_list_api_view: anonymous permissions, minus
    unlisted. There are only a few hundred of these, so no pagination.
    """

    qs = (
        get_projects_qs(user=None)
        .exclude(visibility=Project.Visibility.UNLISTED)
        .filter_tournament()
        .order_by("id")
    )

    # Shaped to match what getProjectLink() expects.
    return [
        {
            "id": row["id"],
            "slug": row["slug"],
            "type": row["type"],
            "lastmod": row["edited_at"],
        }
        for row in qs.values("id", "slug", "type", "edited_at")
    ]
