"""
Module contains Cron Job handlers
"""

import logging

import dramatiq
from django.db.models import Q
from django.utils import timezone

from projects.services.subscriptions import (
    notify_project_subscriptions_post_status_change,
)
from questions.models import Question
from questions.services.lifecycle import handle_question_open
from questions.services.movement import compute_question_movement
from utils.models import ModelBatchUpdater

from .models import Post
from .services.subscriptions import notify_date, notify_milestone

logger = logging.getLogger(__name__)


@dramatiq.actor
def job_subscription_notify_milestone():
    for post in Post.objects.filter_active():
        notify_milestone(post)


@dramatiq.actor
def job_subscription_notify_date():
    notify_date()


@dramatiq.actor
def job_compute_movement():
    chunk_size = 100
    base_qs = Post.objects.filter_questions().prefetch_related("questions")
    active = base_qs.filter_active()
    # Also include resolved posts that have non-zero movement as they will update to
    # having 0.0 movement 7 days after resolution to remove them from the movers feed
    resolved_with_movement = base_qs.filter(resolved=True).exclude(
        Q(movement=0.0) | Q(movement__isnull=True)
    )
    qs = active.union(resolved_with_movement)
    logger.info(f"Start computing movement for {qs.count()} posts")

    with (
        ModelBatchUpdater(
            model_class=Post, fields=["movement"], batch_size=chunk_size
        ) as posts_updater,
        ModelBatchUpdater(
            model_class=Question, fields=["movement"], batch_size=chunk_size
        ) as questions_updater,
    ):
        for post in qs.iterator(chunk_size):
            questions = list(post.questions.all())

            for question in questions:
                question.movement = compute_question_movement(question)
                questions_updater.append(question)

            post.movement = max(
                [q.movement for q in questions if q.movement is not None],
                key=abs,
                default=None,
            )
            posts_updater.append(post)

    logger.info("Done computing movement for posts")


@dramatiq.actor
def job_check_post_open_event():
    """
    A cron job to check for newly published / opened posts and questions.

    Fires two distinct, idempotent events:
    - publish event (tournament / project follower notifications) once per post
      when its `published_at` passes — i.e. the post becomes Upcoming. This is a
      Post-level lifecycle event, so adding questions to an already-published
      post does not re-notify followers.
    - open event (post-level status change notifications) per question when its
      `open_time` passes. This stays question-level to support status update
      emails for subquestions of a group.
    """

    # Tournament / project follower notifications fire at publish time so
    # pre-prediction posts are surfaced before they open for forecasting.
    publish_posts_qs = (
        Post.objects.filter_published()
        .filter(published_at_triggered=False)
        .select_related("notebook")
    )

    for post in publish_posts_qs:
        try:
            notify_project_subscriptions_post_status_change(
                post,
                event=Post.PostStatusChange.PUBLISHED,
                notebook=post.notebook if post.notebook_id else None,
            )
        except Exception:
            logger.exception("Failed to handle post publish")
        finally:
            post.published_at_triggered = True
            post.save(update_fields=["published_at_triggered"])

    questions_qs = Question.objects.filter(
        post__in=Post.objects.filter_published(),
        open_time__lte=timezone.now(),
        open_time_triggered=False,
    ).filter(
        Q(actual_close_time__isnull=True) | Q(actual_close_time__gte=timezone.now())
    )

    for question in questions_qs:
        try:
            handle_question_open(question)
        except Exception:
            logger.exception("Failed to handle question open")
        finally:
            # Mark as triggered
            question.open_time_triggered = True
            question.save(update_fields=["open_time_triggered"])


@dramatiq.actor
def job_warm_posts_feed_cache():
    from posts.services.feed_cache import warm_default_feed_response

    warm_default_feed_response()
