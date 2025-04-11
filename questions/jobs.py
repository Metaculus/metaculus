"""
Module contains Cron Job handlers
"""

import logging

import dramatiq
from django.db.models import Q
from django.utils import timezone

from posts.models import Post
from .models import Question
from .services import handle_question_open, close_question

logger = logging.getLogger(__name__)


@dramatiq.actor
def job_close_question():
    questions_to_close = Question.objects.filter(
        actual_close_time__isnull=True,
        scheduled_close_time__lte=timezone.now(),
        # Don't close draft posts
        related_posts__post__curation_status=Post.CurationStatus.APPROVED,
    ).all()
    for question in questions_to_close:
        try:
            close_question(question)
        except Exception:
            logger.exception(f"Failed to close question {question.id}")


@dramatiq.actor
def job_check_question_open_event():
    """
    A cron job to check for newly opened questions.
    We moved this logic from Post-level to Question-level notifications
    to enable status update emails for subquestion from groups.
    """

    qs = Question.objects.filter(
        related_posts__post__in=Post.objects.filter_published(),
        open_time__lte=timezone.now(),
    ).filter(
        Q(actual_close_time__isnull=True) | Q(actual_close_time__gte=timezone.now())
    )

    for question in qs.filter(open_time_triggered=False):
        try:
            handle_question_open(question)
        except Exception:
            logger.exception("Failed to handle question open")
        finally:
            # Mark as triggered
            question.open_time_triggered = True
            question.save(update_fields=["open_time_triggered"])
