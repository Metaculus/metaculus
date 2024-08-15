import logging

import dramatiq

from posts.models import Post, PostSubscription
from posts.services.search import update_post_search_embedding_vector

logger = logging.getLogger(__name__)


@dramatiq.actor
def run_on_post_forecast(post_id):
    """
    Run async actions on post forecast
    """
    from posts.services.common import (
        compute_post_sorting_divergence_and_update_snapshots,
    )

    post = Post.objects.get(pk=post_id)

    compute_post_sorting_divergence_and_update_snapshots(post)


@dramatiq.actor
def run_notify_post_status_change(
    post_id: int, event: PostSubscription.PostStatusChange
):
    from posts.services.subscriptions import notify_post_status_change

    notify_post_status_change(Post.objects.get(pk=post_id), event)


@dramatiq.actor
def run_post_indexing(post_id):
    update_post_search_embedding_vector(Post.objects.get(pk=post_id))
