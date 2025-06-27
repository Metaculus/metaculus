import logging

from django.db.models import Q

from questions.models import (
    Forecast,
    UserForecastNotification,
)

from django.utils import timezone
from django.core.management.base import BaseCommand
from django.db import transaction

from datetime import timedelta, datetime


logger = logging.getLogger(__name__)


@transaction.atomic
def update_standing_forecasts(before_date):
    has_valid_question_times = Q(
        question__open_time__isnull=False,
        question__scheduled_close_time__isnull=False,
    )
    # Filter active forecasts, made before the "before_date" and belonging to users users that have a prediction expiration percent set
    base_queryset = (
        Forecast.objects.active()
        .filter(has_valid_question_times)
        # end_time check is redundant, but it's here for clarity
        .filter(end_time__isnull=True, start_time__lt=before_date)
        .filter(author__prediction_expiration_percent__isnull=False)
        .select_related("question")
    )

    # Process forecasts in batches to avoid memory issues
    batch_size = 10000
    total_updated = 0
    total_notifications_created = 0

    # Get total count for progress tracking
    total_count = base_queryset.count()

    # Use iterator to process in batches
    forecasts_batch = []
    notifications_batch = []

    for index, forecast in enumerate(base_queryset.iterator(chunk_size=batch_size), 1):
        question = forecast.question
        ten_percent_question_lifetime = (
            question.scheduled_close_time - question.open_time
        ) * 0.1

        forecast_duration_now = timezone.now() - forecast.start_time

        # if prediction was made less than 10% of the question’s lifetime ago (the default setting), it will be withdrawn once it reaches that 10% mark
        # otherwise, if it made more than 10% of the question’s lifetime ago, it will be withdrawn at the next multiple of that 10%.
        intervals_passed = int(forecast_duration_now / ten_percent_question_lifetime)
        next_interval = intervals_passed + 1
        calculated_end_time = forecast.start_time + (
            ten_percent_question_lifetime * next_interval
        )

        # Ensure the forecast duration is:
        # - at least 1 month (30 days)
        # - at least 3 days from now so users have a chance to update
        # - matching the 10% interval logic
        min_onemonth_duration_end_time = forecast.start_time + timedelta(days=30)
        at_least_3days_from_now_end_time = timezone.now() + timedelta(days=3)
        end_time = max(
            calculated_end_time,
            min_onemonth_duration_end_time,
            at_least_3days_from_now_end_time,
        )

        # Update the forecast's end_time in memory
        forecast.end_time = end_time
        forecasts_batch.append(forecast)

        # Create notification following the same logic as in services.py
        total_lifetime = forecast.end_time - forecast.start_time
        if total_lifetime > timedelta(weeks=3):
            # If lifetime > 3 weeks, trigger 1 week before end
            trigger_time = end_time - timedelta(weeks=1)
        else:
            # Otherwise, trigger 1 day before end
            trigger_time = end_time - timedelta(days=1)

        # ensure trigger time is set at least 2 days from now (this is needed for cases when trigger time is set to 1 week before end_time)
        trigger_time = max(trigger_time, timezone.now() + timedelta(days=2))

        # Create notification object (will be bulk created later)
        notification = UserForecastNotification(
            user=forecast.author,
            question=question,
            trigger_time=trigger_time,
            email_sent=False,
            forecast=forecast,
        )
        notifications_batch.append(notification)

        # Update batch when it reaches batch_size or we're at the end
        is_last_item = index == total_count
        if len(forecasts_batch) >= batch_size or is_last_item:
            Forecast.objects.bulk_update(forecasts_batch, ["end_time"])
            total_updated += len(forecasts_batch)

            if notifications_batch:
                UserForecastNotification.objects.bulk_create(
                    notifications_batch, ignore_conflicts=True
                )
                total_notifications_created += len(notifications_batch)

            logger.info(
                f"Updated batch of {len(forecasts_batch)} forecasts and {len(notifications_batch)} notifications. "
                f"Total updated so far: {total_updated} forecasts, {total_notifications_created} notifications"
            )
            forecasts_batch = []
            notifications_batch = []

    logger.info(
        f"Completed updating {total_updated} forecasts and created {total_notifications_created} notifications"
    )


class Command(BaseCommand):
    help = "Mark forecasts to auto withdraw"

    def add_arguments(self, parser):
        parser.add_argument(
            "--before-date",
            type=str,
            help="Date before which to process forecasts (YYYY-MM-DD format)",
            required=False,
            default=None,
        )

    def handle(self, *args, **options):
        before_date = options.get("before_date")

        if before_date is None:
            logger.error(
                "No date provided. Please use --before-date YYYY-MM-DD to specify a date."
            )
            return

        try:
            before_date = datetime.strptime(before_date, "%Y-%m-%d").date()
        except ValueError:
            logger.error("Invalid date format. Please use YYYY-MM-DD format.")
            return

        update_standing_forecasts(before_date)
