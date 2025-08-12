from datetime import timedelta

import dramatiq
from django.utils import timezone

from comments.services.common import update_top_comments_of_week


@dramatiq.actor
def update_current_top_comments_of_week():
    # Update the weekly top comments list for the current week and the one before.
    # We update the week before because the top comments scores are based on
    # commment votes, key factor votes, and change my mind data collected a week
    # after the comment was created (which is still ongoing)
    today = timezone.now().date()
    weekday = today.weekday()
    if weekday == 6:  # today is Sunday, use this Sunday
        week_start_date = today
    else:
        week_start_date = today - timedelta(
            days=weekday + 1  # use +1 to get the previous Sunday
        )

    update_top_comments_of_week(week_start_date)

    # Update the week before
    week_start_date = week_start_date - timedelta(days=7)
    update_top_comments_of_week(week_start_date)
