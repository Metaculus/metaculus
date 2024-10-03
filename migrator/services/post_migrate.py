import logging

from django.db.models import Q, Count, F, Value
from django.db.models.functions import Coalesce
from sql_util.aggregates import SubqueryAggregate

from posts.models import Post
from posts.services.common import compute_post_sorting_divergence_and_update_snapshots
from projects.models import Project

logger = logging.getLogger(__name__)


def post_migrate_calculate_divergence():
    print("Running calculate_divergence")

    posts = (
        Post.objects.filter_active()
        .filter(
            Q(question__isnull=False)
            | Q(group_of_questions__isnull=False)
            | Q(conditional__isnull=False)
        )
        .prefetch_questions()
    )
    posts_total = posts.count()

    for idx, post in enumerate(posts.iterator(chunk_size=100)):
        try:
            compute_post_sorting_divergence_and_update_snapshots(post)
        except Exception:
            logger.exception(f"Error running calculate_divergence for post {post.id}")

        if not idx % 250:
            print(f"Processed {idx + 1}/{posts_total} posts", end="\r")

    print("Finished calculate_divergence")


def post_migrate_update_post_fields():
    # Set total forecasters number
    Post.objects.annotate(
        forecasters_count_value=SubqueryAggregate(
            "forecasts__author_id", aggregate=Count, distinct=True
        )
    ).update(forecasters_count=Coalesce(F("forecasters_count_value"), Value(0)))


def post_migrate_show_on_homepage():
    post_ids = [
        16708,
        14965,
        15007,
        3479,
        5320,
        353,
        17280,
        15462,
        384,
        13858,
        12910,
        12923,
        11437,
        8466,
    ]
    project_slugs = [
        "forecasting-Our-World-in-Data",
        "biosecurity-tournament",
        "ukraine-conflict",
        "keep-virginia-safe-ii",
    ]

    Post.objects.filter(pk__in=post_ids).update(show_on_homepage=True)
    Project.objects.filter(
        type=Project.ProjectTypes.TOURNAMENT, slug__in=project_slugs
    ).update(show_on_homepage=True)
