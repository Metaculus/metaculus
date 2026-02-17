import logging
from collections import defaultdict

import dramatiq
from django.db.models import Q

from notifications.models import Notification
from notifications.services import (
    get_notification_handler_by_type,
    NotificationPostStatusChange,
)
from posts.models import Post

logger = logging.getLogger(__name__)


def _get_notification_schedules() -> dict[str, Q]:
    """
    Single source of truth for all notification schedule filters.
    "default" is the catch-all handled by job_send_notification_groups.
    Other keys are handled by dedicated cron jobs.
    """

    custom = {
        "open_status": Q(
            type=NotificationPostStatusChange.type,
            params__event=Post.PostStatusChange.OPEN,
        ),
    }

    # Default schedule: everything not claimed by custom schedules
    default_q = Q()
    for q_filter in custom.values():
        default_q &= ~q_filter

    return {"default": default_q, **custom}


@dramatiq.actor
def job_send_notification_groups():
    """
    Aggregates and sends grouped notifications to the recipients.
    Automatically excludes notifications handled by dedicated schedule jobs.
    """

    qs = Notification.objects.filter_pending_email().filter(
        _get_notification_schedules()["default"]
    )

    _send_grouped_notifications(qs)


@dramatiq.actor
def job_send_open_status_notifications():
    """
    Sends only post_status_change notifications with event=open.
    Runs every 30 minutes for faster delivery of OPEN status changes.
    """

    qs = Notification.objects.filter_pending_email().filter(
        _get_notification_schedules()["open_status"]
    )

    _send_grouped_notifications(qs)


def _send_grouped_notifications(qs):
    # { user: { notification_type: [notifications] } }
    grouped_notifications = defaultdict(lambda: defaultdict(list))

    for notification in qs:
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

                # Mark as sent
                for notification in notifications:
                    notification.mark_as_sent()
                    notification.save()
            except Exception:
                logger.exception("Error while processing notification")
