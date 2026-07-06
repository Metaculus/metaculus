import logging
from datetime import date, timedelta
from typing import Union

import dramatiq
from django.utils import timezone

from comments.models import Comment, CommentsOfTheWeekNotification
from comments.services.notifications import (
    notify_mentioned_users,
    notify_weekly_top_comments_subscribers,
)
from posts.services.subscriptions import notify_new_comments

logger = logging.getLogger(__name__)


@dramatiq.actor
def run_on_post_comment_create(comment_id: int):
    comment = Comment.objects.get(id=comment_id)
    post = comment.on_post

    # Notify mentioned users
    notify_mentioned_users(comment)

    # Notify new comments
    notify_new_comments(post)


def _get_week_start_for_date(today: date) -> date:
    weekday = today.weekday()
    if weekday == 6:  # today is Sunday, use this Sunday
        week_start_date = today
    else:
        week_start_date = today - timedelta(
            days=weekday + 1  # use +1 to get the previous Sunday
        )

    return week_start_date


@dramatiq.actor
def job_finalize_and_send_weekly_top_comments(
    date_input: Union[date, str] = None, force_send: bool = False
):
    # Import here to avoid circular imports
    from comments.services.common import update_top_comments_of_week

    # Handle both string and date inputs for JSON serialization
    if isinstance(date_input, str):
        date_obj = date.fromisoformat(date_input)
    else:
        date_obj = date_input or timezone.now().date()
    last_sunday = _get_week_start_for_date(date_obj)
    # The function expects the week start to be the Sunday BEFORE the finalized week
    # So if we finalize the week that ended last_sunday, we pass two Sundays ago
    finalizing_week_start_date = last_sunday - timedelta(days=14)

    try:
        update_top_comments_of_week(finalizing_week_start_date)
    except Exception:
        logger.exception(
            f"Failed to update top comments for week starting {finalizing_week_start_date}"
        )
        return

    already_notified = CommentsOfTheWeekNotification.objects.filter(
        week_start_date=finalizing_week_start_date,
        email_sent=True,
    ).exists()

    if already_notified and not force_send:
        return

    notify_weekly_top_comments_subscribers(
        week_start_date=finalizing_week_start_date,
    )
    CommentsOfTheWeekNotification.objects.create(
        week_start_date=finalizing_week_start_date,
        email_sent=True,
    )

    logger.info(
        f"Triggered weekly top comments emails for week starting {finalizing_week_start_date}"
    )


@dramatiq.actor
def update_current_top_comments_of_week():
    # Import here to avoid circular imports
    from comments.services.common import update_top_comments_of_week

    # Update the weekly top comments list for the current week and the one before.
    # We update the week before because the top comments scores are based on
    # comment votes, key factor votes, and change my mind data collected a week
    # after the comment was created (which is still ongoing)
    today = timezone.now().date()
    week_start_date = _get_week_start_for_date(today)
    update_top_comments_of_week(week_start_date)

    # Update the week before
    week_start_date = week_start_date - timedelta(days=7)
    update_top_comments_of_week(week_start_date)
