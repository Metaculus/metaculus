import logging

from django.db.models import Q, Count, F, Value
from django.db.models.functions import Coalesce
from sql_util.aggregates import SubqueryAggregate

from posts.models import Post
from posts.services.common import compute_post_sorting_divergence_and_update_snapshots

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
