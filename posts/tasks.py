import logging

import dramatiq

from posts.models import Post, PostUserSnapshot, PostSubscription
from posts.services.search import update_post_search_embedding_vector

logger = logging.getLogger(__name__)


@dramatiq.actor
def run_compute_sorting_divergence(post_id):
    """
    TODO: ensure tasks of this group are executed consequent and keep the FIFO order
        and implement a cancellation of previous task with the same type
    """
    from posts.services.common import compute_sorting_divergence

    print(f"Running run_compute_sorting_divergence for post_id {post_id}")

    post = Post.objects.get(pk=post_id)

    divergence = compute_sorting_divergence(post)

    snapshots = PostUserSnapshot.objects.filter(
        post=post, user_id__in=divergence.keys()
    )

    bulk_update = []

    for user_snapshot in snapshots:
        div = divergence.get(user_snapshot.user_id)

        if div is not None:
            user_snapshot.divergence = div
            bulk_update.append(user_snapshot)

    PostUserSnapshot.objects.bulk_update(bulk_update, fields=["divergence"])

    print(
        f"Finished run_compute_sorting_divergence for post_id {post_id}. "
        f"Updated {len(bulk_update)} user snapshots"
    )


@dramatiq.actor
def run_notify_post_status_change(
    post_id: int, event: PostSubscription.PostStatusChange
):
    from posts.services.subscriptions import notify_post_status_change

    notify_post_status_change(Post.objects.get(pk=post_id), event)


@dramatiq.actor
def run_post_indexing(post_id):
    update_post_search_embedding_vector(Post.objects.get(pk=post_id))
