"""
Module contains Cron Job handlers
"""

import logging

import dramatiq
from django.db.models import Q
from django.utils import timezone

from posts.models import Post, Notebook
from posts.services.subscriptions import (
    notify_milestone,
    notify_date,
)
from projects.services.subscriptions import notify_project_subscriptions_post_open
from questions.models import Question
from questions.services.lifecycle import handle_question_open
from questions.services.movement import compute_question_movement
from utils.models import ModelBatchUpdater

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
    A cron job to check for newly opened questions and published posts.
    We moved this logic from Post-level to Question-level notifications
    to enable status update emails for subquestion from groups.
    """

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

    # Process notebook records
    notebooks_qs = Notebook.objects.filter(
        post__in=Post.objects.filter_published(), open_time_triggered=False
    ).select_related("post")

    for notebook in notebooks_qs:
        try:
            notify_project_subscriptions_post_open(notebook.post, notebook=notebook)
        except Exception:
            logger.exception("Failed to handle notebook publish")
        finally:
            # Mark as triggered
            notebook.open_time_triggered = True
            notebook.save(update_fields=["open_time_triggered"])
