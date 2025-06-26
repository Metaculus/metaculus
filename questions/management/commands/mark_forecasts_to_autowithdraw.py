import logging

from django.db.models import Q

from questions.models import (
    Forecast,
    UserForecastNotification,
)

from django.utils import timezone
from django.core.management.base import BaseCommand
from django.db import transaction

from datetime import timedelta


logger = logging.getLogger(__name__)


@transaction.atomic
def update_standing_forecasts():
    # Define reusable Q expressions for readability
    has_valid_question_times = Q(
        question__open_time__isnull=False,
        question__scheduled_close_time__isnull=False,
    )

    # Filter active forecasts that have valid question time fields
    base_queryset = (
        Forecast.objects.active()
        .filter(end_time__isnull=True)
        .filter(has_valid_question_times)
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

        question_lifetime = question.scheduled_close_time - question.open_time

        ten_percent_lifetime = question_lifetime * 0.1

        forecast_duration_now = timezone.now() - forecast.start_time

        # if prediction was made less than 10% of the question’s lifetime ago (the default setting), it will be withdrawn once it reaches that 10% mark
        # otherwise, if it made more than 10% of the question’s lifetime ago, it will be withdrawn at the next multiple of that 10%.
        intervals_passed = int(forecast_duration_now / ten_percent_lifetime)
        next_interval = intervals_passed + 1
        calculated_end_time = forecast.start_time + (
            ten_percent_lifetime * next_interval
        )

        # Ensure minimum duration of 1 month (30 days)
        minimum_end_time = forecast.start_time + timedelta(days=30)
        end_time = max(calculated_end_time, minimum_end_time)

        # Make sure we don't set end_time beyond the question's close time
        if end_time > question.scheduled_close_time:
            end_time = question.scheduled_close_time

        # Update the forecast's end_time in memory
        forecast.end_time = end_time
        forecasts_batch.append(forecast)

        # Create notification following the same logic as in services.py
        total_lifetime = forecast.end_time - forecast.start_time
        if total_lifetime >= timedelta(hours=8):
            if total_lifetime > timedelta(weeks=3):
                # If lifetime > 3 weeks, trigger 1 week before end
                trigger_time = end_time - timedelta(weeks=1)
            else:
                # Otherwise, trigger 1 day before end
                trigger_time = end_time - timedelta(days=1)

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

    def handle(self, *args, **options):
        update_standing_forecasts()
