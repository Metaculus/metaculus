import logging

import dramatiq

from posts.models import Post
from posts.services.search import update_post_search_embedding_vector
from posts.services.subscriptions import (
    notify_post_cp_change,
    notify_post_status_change,
)
from utils.dramatiq import concurrency_retries, task_concurrent_limit

logger = logging.getLogger(__name__)


@dramatiq.actor(max_backoff=180_000, retry_when=concurrency_retries(max_retries=10))
@task_concurrent_limit(
    lambda post_id: f"on-post-forecast-{post_id}",
    # We want only one task for the same post id be executed at the same time
    limit=1,
    # This task shouldn't take longer than 3m
    ttl=180_000,
)
def run_on_post_forecast(post_id):
    """
    Run async actions on post forecast
    """
    from posts.services.common import (
        compute_post_sorting_divergence_and_update_snapshots,
    )

    post = Post.objects.get(pk=post_id)

    # Update counters
    post.update_forecasters_count()

    compute_post_sorting_divergence_and_update_snapshots(post)
    notify_post_cp_change(post)


@dramatiq.actor
def run_post_indexing(post_id):
    try:
        update_post_search_embedding_vector(Post.objects.get(pk=post_id))
    except Post.DoesNotExist:
        logger.warning(f"Post {post_id} does not exist")
