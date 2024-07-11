import logging
from functools import wraps

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django import db
from django.conf import settings
from django.core.management.base import BaseCommand
from django_dramatiq.tasks import delete_old_tasks

from posts.tasks import run_compute_movement

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
            close_old_connections(run_compute_movement.send),
            trigger=CronTrigger.from_crontab("0 * * * *"),  # Every Hour
            id="posts_run_compute_movement",
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
