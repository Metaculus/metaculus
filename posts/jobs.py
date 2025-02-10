"""
Module contains Cron Job handlers
"""

import logging

import django
import dramatiq
from django.db.models import Q

from posts.models import Post
from posts.services.subscriptions import notify_milestone, notify_date
from questions.models import Question
from questions.services import close_question

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

    for post in Post.objects.filter_active().filter(open_time_triggered=False):
        try:
            handle_post_open(post)
        except Exception:
            logger.exception("Failed to handle post open")
        finally:
            # Mark as triggered
            post.open_time_triggered = True
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

    posts = []

    for i, post in enumerate(qs.iterator(100), 1):
        try:
            post.movement = compute_movement(post)
        except Exception:
            logger.exception(f"Error during compute_movement for post_id {post.id}")
            continue

        posts.append(post)

        if len(posts) >= 100:
            print("bulk updating...", end="\r")
            Post.objects.bulk_update(posts, fields=["movement"])
            posts = []
            print("bulk updating... DONE")

    print("bulk updating...", end="\r")
    Post.objects.bulk_update(posts, fields=["movement"])
    print("bulk updating... DONE")


@dramatiq.actor
def job_close_question():
    questions_to_close = Question.objects.filter(
        actual_close_time__isnull=True,
        scheduled_close_time__lte=django.utils.timezone.now(),
        # Don't close draft posts
        related_posts__post__curation_status=Post.CurationStatus.APPROVED,
    ).all()
    for question in questions_to_close:
        try:
            close_question(question)
        except Exception:
            logger.exception(f"Failed to close question {question.id}")
