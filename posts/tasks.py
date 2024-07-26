import logging

import dramatiq
from django.db.models import Q

from posts.models import Post, PostUserSnapshot, PostSubscription

logger = logging.getLogger(__name__)


@dramatiq.actor
def run_compute_sorting_divergence(post_id):
    """
    TODO: ensure tasks of this group are executed consequent and keep the FIFO order
        and implement a cancellation of previous task with the same type
    """
    from posts.services.common import compute_sorting_divergence

    logger.info(f"Running run_compute_sorting_divergence for post_id {post_id}")

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

    logger.info(
        f"Finished run_compute_sorting_divergence for post_id {post_id}. "
        f"Updated {len(bulk_update)} user snapshots"
    )


@dramatiq.actor
def run_compute_movement():
    from posts.services.common import compute_movement

    qs = (
        Post.objects.filter_active()
        .filter(
            Q(question__isnull=False)
            | Q(group_of_questions__isnull=False)
            | Q(conditional__isnull=False)
        )
        .prefetch_questions()
    )
    total = qs.count()

    posts = []

    for idx, post in enumerate(qs.iterator(100)):
        try:
            post.movement = compute_movement(post)
        except:
            logger.exception(f"Error during compute_movement for post_id {post.id}")
            continue

        posts.append(post)

        if len(posts) >= 100:
            Post.objects.bulk_update(posts, fields=["movement"])
            posts = []

        if not idx % 100:
            logger.info(f"Processed {idx + 1}/{total}. ")


@dramatiq.actor
def run_subscription_notify_date():
    from posts.services.subscriptions import notify_date

    notify_date()


@dramatiq.actor
def run_notify_post_status_change(
    post_id: int, event: PostSubscription.PostStatusChange
):
    from posts.services.subscriptions import notify_post_status_change

    notify_post_status_change(Post.objects.get(pk=post_id), event)


@dramatiq.actor
def run_notify_new_comments(post_id: int):
    from posts.services.subscriptions import notify_new_comments

    notify_new_comments(Post.objects.get(pk=post_id))


@dramatiq.actor
def run_notify_milestone():
    from posts.services.subscriptions import notify_milestone

    for post in Post.objects.filter_active():
        notify_milestone(post)
