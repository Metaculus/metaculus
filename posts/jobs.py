"""
Module contains Cron Job handlers
"""

import logging

import dramatiq

from posts.models import Post
from posts.services.subscriptions import notify_milestone, notify_date
from questions.models import Question
from questions.services import compute_question_movement
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
    qs = Post.objects.filter_active().filter_questions().prefetch_questions()
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
            questions = post.get_questions()

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
