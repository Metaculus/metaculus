"""
Module contains Cron Job handlers
"""

import logging

import dramatiq
from django.db.models import Q

from posts.models import Post
from posts.services.subscriptions import notify_milestone, notify_date

logger = logging.getLogger(__name__)


@dramatiq.actor
def job_subscription_notify_milestone():
    for post in Post.objects.filter_active():
        notify_milestone(post)


@dramatiq.actor
def job_subscription_notify_date():
    notify_date()


@dramatiq.actor
def job_check_post_open_event():
    """
    A cron job checking for newly opened posts
    """
    from posts.services.common import handle_post_open

    for post in Post.objects.filter_active().filter(published_at_triggered=False):
        try:
            handle_post_open(post)
        except Exception:
            logger.exception("Failed to handle post open")
        finally:
            # Mark as triggered
            post.published_at_triggered = True
            post.save()


@dramatiq.actor
def job_compute_movement():
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

    for i, post in enumerate(qs.iterator(100), 1):
        try:
            post.movement = compute_movement(post)
        except Exception:
            logger.exception(f"Error during compute_movement for post_id {post.id}")
            continue

        posts.append(post)

        if len(posts) >= 100:
            Post.objects.bulk_update(posts, fields=["movement"])
            posts = []

        print(f"compute movement: {i}/{total}", end="\r")

    print("bulk updating...", end="\r")
    Post.objects.bulk_update(posts, fields=["movement"])
    print("bulk updating... DONE")
