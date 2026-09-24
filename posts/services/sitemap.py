from posts.models import Post
from posts.utils import build_post_slug
from projects.models import Project


def get_sitemap_posts_qs():
    """
    Publicly indexable posts.

    Note this deliberately does not exclude bots-only posts: the frontend owns
    the indexable/noindex predicate so that a sitemap entry and the page's own
    robots/canonical tags cannot disagree. See utils/questions/metadata.ts.
    """

    return (
        Post.objects.filter(
            curation_status=Post.CurationStatus.APPROVED,
            published_at__isnull=False,
        )
        .exclude(default_project__visibility=Project.Visibility.UNLISTED)
        .order_by("id")
    )


def get_sitemap_posts() -> list[dict]:
    """
    Minimal post data for sitemap generation, unpaginated.

    Flat .values() rather than the Post serializer: this enumerates every
    indexable post, so nothing here may touch questions or forecasts.
    """

    rows = get_sitemap_posts_qs().values(
        "id",
        "title",
        "short_title",
        "notebook_id",
        "edited_at",
        "actual_close_time",
        "actual_resolve_time",
        "published_at",
        "html_metadata_json",
        "default_project__slug",
        "default_project__type",
        "default_project__bot_leaderboard_status",
    )

    # Shaped to match what getPostLink() expects, so rows pass straight in.
    return [
        {
            "id": row["id"],
            "slug": build_post_slug(row["short_title"], row["title"]),
            "notebook": {"id": row["notebook_id"]} if row["notebook_id"] else None,
            "projects": {
                "default_project": {
                    "slug": row["default_project__slug"],
                    "type": row["default_project__type"],
                    "bot_leaderboard_status": row[
                        "default_project__bot_leaderboard_status"
                    ],
                }
            },
            "html_metadata_json": row["html_metadata_json"],
            # Latest visible change: content edit or a lifecycle transition
            # (close/resolve). Excludes CP, which changes too often to trust.
            "lastmod": max(
                filter(
                    None,
                    [
                        row["edited_at"],
                        row["actual_close_time"],
                        row["actual_resolve_time"],
                    ],
                ),
                default=None,
            )
            or row["published_at"],
        }
        for row in rows
    ]
