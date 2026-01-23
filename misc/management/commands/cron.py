import logging
from functools import wraps

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django import db
from django.conf import settings
from django.core.management.base import BaseCommand
from django_dramatiq.tasks import delete_old_tasks

from comments.tasks import (
    update_current_top_comments_of_week,
    job_finalize_and_send_weekly_top_comments,
)
from misc.jobs import sync_itn_articles
from notifications.jobs import job_send_notification_groups
from posts.jobs import (
    job_compute_movement,
    job_subscription_notify_date,
    job_subscription_notify_milestone,
    job_check_post_open_event,
)
from posts.services.hotness import compute_feed_hotness
from questions.jobs import job_close_question
from questions.tasks import check_and_schedule_forecast_widrawal_due_notifications
from scoring.jobs import (
    finalize_leaderboards,
    update_global_comment_and_question_leaderboards,
    update_gobal_bot_leaderboard,
    update_custom_leaderboards,
)
from scoring.utils import update_medal_points_and_ranks


logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


def close_old_connections(func):
    """
    A decorator that ensures that Django database connections that have become unusable, or are obsolete, are closed
    before and after a method is executed (see: https://docs.djangoproject.com/en/dev/ref/databases/#general-notes
    for background).

    This decorator is intended to be used to wrap APScheduler jobs, and provides functionality comparable to the
    Django standard approach of closing old connections before and after each HTTP request is processed.

    It only makes sense for APScheduler jobs that require database access, and prevents `django.db.OperationalError`s.
    """

    @wraps(func)
    def func_wrapper(*args, **kwargs):
        db.close_old_connections()
        try:
            result = func(*args, **kwargs)
        finally:
            db.close_old_connections()

        return result

    return func_wrapper


class Command(BaseCommand):
    help = "Cron Runner"

    def handle(self, *args, **options):
        """
        Always wrap cron jobs with `close_old_connections`
        The `close_old_connections` decorator ensures that database connections, that have become
        unusable or are obsolete, are closed before and after your job has run. You should use it
        to wrap any jobs that you schedule that access the Django database in any way.
        """

        scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)

        # Dramatiq old tasks cleanup
        scheduler.add_job(
            close_old_connections(delete_old_tasks.send),
            kwargs={"max_task_age": 60 * 60 * 24},
            trigger=CronTrigger.from_crontab("0 0 * * *"),  # Every day at 00:00 UTC
            id="dramatiq_delete_old_tasks",
            max_instances=1,
            replace_existing=True,
        )

        #
        # Post Jobs
        #
        scheduler.add_job(
            close_old_connections(job_compute_movement.send),
            trigger=CronTrigger.from_crontab("0 * * * *"),  # Every Hour
            id="posts_job_compute_movement",
            max_instances=1,
            replace_existing=True,
        )
        scheduler.add_job(
            close_old_connections(compute_feed_hotness),
            trigger=CronTrigger.from_crontab("*/15 * * * *"),  # Every 15 minutes
            id="posts_compute_hotness",
            max_instances=1,
            replace_existing=True,
        )
        scheduler.add_job(
            close_old_connections(job_subscription_notify_date.send),
            trigger=CronTrigger.from_crontab("30 * * * *"),  # Every Hour at :30
            id="posts_job_subscription_notify_date",
            max_instances=1,
            replace_existing=True,
        )
        scheduler.add_job(
            close_old_connections(job_subscription_notify_milestone.send),
            trigger=CronTrigger.from_crontab("0 12 * * *"),  # Every Day at 12 PM
            id="posts_job_subscription_notify_milestone",
            max_instances=1,
            replace_existing=True,
        )
        scheduler.add_job(
            close_old_connections(job_check_post_open_event.send),
            trigger=CronTrigger.from_crontab("45 * * * *"),  # Every Hour at :45
            id="posts_job_check_post_open_event",
            max_instances=1,
            replace_existing=True,
        )

        #
        # Question jobs
        #
        scheduler.add_job(
            close_old_connections(job_close_question.send),
            trigger=CronTrigger.from_crontab("* * * * *"),  # Every Minute
            id="questions_job_close_question",
            max_instances=1,
            replace_existing=True,
        )

        #
        # Notification jobs
        #
        scheduler.add_job(
            close_old_connections(job_send_notification_groups.send),
            trigger=CronTrigger.from_crontab("0 0 * * *"),  # Every day at 00:00 UTC
            id="notifications_job_send_notification_groups",
            max_instances=1,
            replace_existing=True,
        )

        #
        # ITN Sync Job
        #
        scheduler.add_job(
            close_old_connections(sync_itn_articles),
            trigger=CronTrigger.from_crontab("0 1 * * *"),  # Every day at 01:00 UTC
            id="misc_sync_itn_articles",
            max_instances=1,
            replace_existing=True,
        )

        #
        # Forecast Auto Withdrawal Job
        #
        scheduler.add_job(
            close_old_connections(
                check_and_schedule_forecast_widrawal_due_notifications.send
            ),
            trigger=CronTrigger.from_crontab("0 0 * * *"),  # Every day at 00:00 UTC
            id="forecast_auto_withdrawal",
            max_instances=1,
            replace_existing=True,
        )

        # Weekly Top Comments every Sunday at 12:00 UTC
        scheduler.add_job(
            close_old_connections(job_finalize_and_send_weekly_top_comments.send),
            trigger=CronTrigger.from_crontab("0 12 * * 6"),
            id="weekly_top_comments_finalize_and_send",
            max_instances=1,
            replace_existing=True,
        )

        #
        # Scoring Jobs
        #
        scheduler.add_job(
            close_old_connections(update_global_comment_and_question_leaderboards),
            trigger=CronTrigger.from_crontab("0 2 * * *"),  # Every day at 02:00 UTC
            id="global_comment_and_question_leaderboards",
            max_instances=1,
            replace_existing=True,
        )
        scheduler.add_job(
            close_old_connections(finalize_leaderboards),
            trigger=CronTrigger.from_crontab("0 3 * * *"),  # Every day at 03:00 UTC
            id="finalize_leaderboards",
            max_instances=1,
            replace_existing=True,
        )
        scheduler.add_job(
            close_old_connections(update_medal_points_and_ranks),
            trigger=CronTrigger.from_crontab("0 4 * * *"),  # Every day at 04:00 UTC
            id="update_medal_points_and_ranks",
            max_instances=1,
            replace_existing=True,
        )
        scheduler.add_job(
            close_old_connections(update_custom_leaderboards),
            trigger=CronTrigger.from_crontab("0 5 * * *"),  # Every day at 05:00 UTC
            id="update_custom_leaderboards",
            max_instances=1,
            replace_existing=True,
        )
        scheduler.add_job(
            close_old_connections(update_gobal_bot_leaderboard),
            trigger=CronTrigger.from_crontab("0 5 * * *"),  # Every day at 05:00 UTC
            id="update_gobal_bot_leaderboard",
            max_instances=1,
            replace_existing=True,
        )

        #
        # Comment Jobs
        #
        if settings.WEEKLY_TOP_COMMENTS_SEND_EMAILS:
            scheduler.add_job(
                close_old_connections(update_current_top_comments_of_week.send),
                trigger=CronTrigger.from_crontab("0 * * * *"),  # Every hour
                id="update_current_top_comments_of_week",
                max_instances=1,
                replace_existing=True,
            )

        try:
            logger.info("Starting scheduler...")
            scheduler.start()
        except KeyboardInterrupt:
            logger.info("Stopping scheduler...")
            scheduler.shutdown()
            logger.info("Scheduler shut down successfully!")
