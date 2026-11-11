import logging
from collections import defaultdict
from datetime import timedelta

import dramatiq
from django.db.models import Q
from django.utils import timezone

from notifications.models import Notification
from notifications.services import (
    get_notification_handler_by_type,
    NotificationPostStatusChange,
)
from posts.models import Post

logger = logging.getLogger(__name__)

# Sent notifications older than this are deleted
SENT_NOTIFICATION_RETENTION_DAYS = 90


def _get_notification_schedules() -> dict[str, Q]:
    """
    Single source of truth for all notification schedule filters.
    "default" is the catch-all handled by job_send_notification_groups.
    Other keys are handled by dedicated cron jobs.
    """

    custom = {
        "open_status": Q(
            type=NotificationPostStatusChange.type,
            params__event__in=[
                Post.PostStatusChange.PUBLISHED,
                Post.PostStatusChange.OPEN,
            ],
        ),
    }

    # Default schedule: everything not claimed by custom schedules
    default_q = Q()
    for q_filter in custom.values():
        default_q &= ~q_filter

    return {"default": default_q, **custom}


@dramatiq.actor(max_retries=1, time_limit=1_800_000)
def job_send_notification_groups():
    """
    Aggregates and sends grouped notifications to the recipients.
    Automatically excludes notifications handled by dedicated schedule jobs.
    """

    qs = Notification.objects.filter_pending_email().filter(
        _get_notification_schedules()["default"]
    )

    _send_grouped_notifications(qs)


@dramatiq.actor(max_retries=1)
def job_send_open_status_notifications():
    """
    Sends only post_status_change notifications with event in (published, open).
    Runs every 30 minutes for faster delivery of PUBLISHED / OPEN status changes.
    """

    qs = Notification.objects.filter_pending_email().filter(
        _get_notification_schedules()["open_status"]
    )

    _send_grouped_notifications(qs)


def _send_grouped_notifications(qs):
    # { user: { notification_type: [notifications] } }
    grouped_notifications = defaultdict(lambda: defaultdict(list))

    for notification in qs.select_related("recipient"):
        grouped_notifications[notification.recipient][notification.type].append(
            notification
        )

    # Running notifications scheduling
    for recipient, groups in grouped_notifications.items():
        for notification_type, notifications in groups.items():
            handler_cls = get_notification_handler_by_type(notification_type)

            # Send group of notifications
            try:
                handler_cls.send_email_group(notifications)

                Notification.objects.filter(
                    pk__in=[notification.pk for notification in notifications]
                ).mark_as_sent()
            except Exception:
                logger.exception("Error while processing notification")


@dramatiq.actor(max_retries=1, time_limit=1_800_000)
def job_delete_old_sent_notifications():
    """
    Deletes notifications whose email went out more than
    `SENT_NOTIFICATION_RETENTION_DAYS` ago. Notifications only feed the email
    queue, so nothing reads a row back once it has been sent.
    """

    cutoff = timezone.now() - timedelta(days=SENT_NOTIFICATION_RETENTION_DAYS)
    deleted, _ = Notification.objects.filter(
        created_at__lt=cutoff, email_sent=True
    ).delete()

    logger.info(f"Deleted {deleted} sent notification(s) older than {cutoff}")
