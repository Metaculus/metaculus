import logging


from questions.models import (
    UserForecastNotification,
    Forecast,
)
from django.db.models import Subquery, OuterRef, Count
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.db import transaction

from datetime import timedelta


logger = logging.getLogger(__name__)


@transaction.atomic
def reschedule_past_notificatoins(now):
    past_notifications_qs = UserForecastNotification.objects.filter(
        trigger_time__lt=now,
        email_sent=False,
        forecast__end_time__isnull=False,
    )

    # We have some notifications with a trigger time in the past and they need fixing.
    # Some of these are corresponding to forecasts which are already withdrawn and others
    # to ones that will be withdrawn in the future. We need to do:

    # 1. The notifications corresponding to forecasts which are already withdrawn should get a
    #    trigger time of now, so they are picked up by the next email sending task.

    # 2. The notifications corresponding to standing forecasts should be rescheduled to be sent a
    #    day before the end of their forecast

    # Or a simplified version, with more or less the same result:
    # 1. Update all notifications these past notifications to have the trigger_time equal to the forecast.end_time - 1 day
    # 2. All those notifications who endup with a trigger_time in the past should be set to now
    # As long as now is within the window that the sending task accepts, then we should be fine.

    logger.info(
        f"Found {past_notifications_qs.count()} past notifications to reschedule"
    )

    # Step 1: Update all past notifications to have trigger_time = forecast.end_time - 1 day
    # Use a subquery to avoid joined field references in update
    forecast_end_time_subquery = Subquery(
        Forecast.objects.filter(id=OuterRef("forecast_id")).values("end_time")[:1]
    )

    users_count = past_notifications_qs.aggregate(
        user_count=Count("user", distinct=True)
    )["user_count"]
    updated_count = past_notifications_qs.update(
        trigger_time=forecast_end_time_subquery - timedelta(days=1)
    )
    logger.info(
        f"Updated {updated_count} notifications to forecast.end_time - 1 day for {users_count} users"
    )

    # Step 2: Set any notifications that still have trigger_time in the past to now
    still_past_notifications_qs = UserForecastNotification.objects.filter(
        trigger_time__lt=now,
        email_sent=False,
    )
    users_count = still_past_notifications_qs.aggregate(
        user_count=Count("user", distinct=True)
    )["user_count"]
    final_updated_count = still_past_notifications_qs.update(trigger_time=now)

    logger.info(
        f"Set {final_updated_count} notifications with past trigger_time to now for {users_count} users"
    )


class Command(BaseCommand):
    help = "Mark forecasts to auto withdraw"

    def add_arguments(self, parser):
        parser.add_argument(
            "--now",
            type=str,
            help="Now in the format YYYY-MM-DD HH:MM:SS",
            default=None,
        )
        parser.add_argument(
            "--dry-run",
            choices=["true", "false"],
            help="Do not actually update the database",
            default="true",
        )

    def handle(self, *args, **options):
        now = (
            timezone.make_aware(
                timezone.datetime.strptime(options["now"], "%Y-%m-%d %H:%M:%S")
            )
            if options["now"] is not None
            else timezone.now()
        )

        logging.info(f"Rescheduling past notifications for {now}")

        dry_run = options["dry_run"].lower() == "true"

        with transaction.atomic():
            reschedule_past_notificatoins(now)
            if dry_run:
                transaction.set_rollback(True)
