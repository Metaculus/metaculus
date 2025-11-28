import logging

import dramatiq

from misc.services.itn import generate_related_articles_for_post
from users.models import User
from utils.dramatiq import concurrency_retries, task_concurrent_limit
from .models import Post
from .services.search import update_post_search_embedding_vector
from .services.subscriptions import notify_post_cp_change
from .services.versioning import PostVersionService

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

    # Update related project stats
    for project in post.get_related_projects():
        if project.type in (
            project.ProjectTypes.COMMUNITY,
            project.ProjectTypes.TOURNAMENT,
            project.ProjectTypes.QUESTION_SERIES,
            project.ProjectTypes.INDEX,
        ):
            project.update_forecasts_count()
            project.update_forecasters_count()
            project.save(update_fields=["forecasts_count", "forecasters_count"])


@dramatiq.actor
def run_post_indexing(post_id):
    try:
        post = Post.objects.get(pk=post_id)

        update_post_search_embedding_vector(post)
        generate_related_articles_for_post(post)
    except Post.DoesNotExist:
        logger.warning(f"Post {post_id} does not exist")


@dramatiq.actor(max_retries=1)
def run_post_generate_history_snapshot(post_id: int, updated_by_id: int):
    updated_by = User.objects.get(pk=updated_by_id) if updated_by_id else None
    post = Post.objects.get(pk=post_id)

    PostVersionService.generate_and_upload(post, updated_by=updated_by)
