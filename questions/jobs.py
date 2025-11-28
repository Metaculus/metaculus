"""
Module contains Cron Job handlers
"""

import logging

import dramatiq
from django.utils import timezone

from posts.models import Post
from .models import Question
from .services.lifecycle import close_question

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
