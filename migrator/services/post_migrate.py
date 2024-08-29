import logging

from django.db.models import Q

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
