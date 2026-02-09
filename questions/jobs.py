"""
Module contains Cron Job handlers
"""

import logging

import dramatiq
from django.utils import timezone

from posts.models import Post
from .models import Question
from .services.lifecycle import close_question, handle_cp_revealed

logger = logging.getLogger(__name__)


@dramatiq.actor
def job_close_question():
    questions_to_close = Question.objects.filter(
        actual_close_time__isnull=True,
        scheduled_close_time__lte=timezone.now(),
        # Don't close draft posts
        post__curation_status=Post.CurationStatus.APPROVED,
    ).all()
    for question in questions_to_close:
        try:
            close_question(question)
        except Exception:
            logger.exception(f"Failed to close question {question.id}")


@dramatiq.actor
def job_check_cp_revealed():
    """
    A cron job to check for questions where CP has been revealed.
    """
    questions_to_reveal = Question.objects.filter(
        cp_reveal_time__lte=timezone.now(),
        cp_reveal_time_triggered=False,
        # Only notify for approved posts
        post__curation_status=Post.CurationStatus.APPROVED,
    ).select_related("post")

    for question in questions_to_reveal:
        try:
            handle_cp_revealed(question)
            # Mark as triggered
            question.cp_reveal_time_triggered = True
            question.save(update_fields=["cp_reveal_time_triggered"])
        except Exception:
            logger.exception(f"Failed to handle CP revealed for question {question.id}")
