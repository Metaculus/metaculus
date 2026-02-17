import logging
from collections import defaultdict

import dramatiq

from notifications.models import Notification
from notifications.services import (
    get_notification_handler_by_type,
    NotificationPostStatusChange,
)
from posts.models import Post

logger = logging.getLogger(__name__)


@dramatiq.actor
def job_send_notification_groups():
    """
    Aggregates and sends grouped notifications to the recipients.
    Excludes post_status_change notifications with event=open,
    which are handled by job_send_open_status_notifications.
    """

    # { user_id: { NotificationType: list[Notification] } }
    grouped_notifications = defaultdict(lambda: defaultdict(list))

    # Grouping notifications
    for notification in Notification.objects.filter_pending_email().exclude(
        type=NotificationPostStatusChange.type, params__event=Post.PostStatusChange.OPEN
    ):
        grouped_notifications[notification.recipient][notification.type].append(
            notification
        )

    _send_grouped_notifications(grouped_notifications)


@dramatiq.actor
def job_send_open_status_notifications():
    """
    Sends only post_status_change notifications with event=open.
    Runs every 30 minutes for faster delivery of OPEN status changes.
    """

    # { user_id: { NotificationType: list[Notification] } }
    grouped_notifications = defaultdict(lambda: defaultdict(list))

    for notification in Notification.objects.filter_pending_email().filter(
        type=NotificationPostStatusChange.type,
        params__event=Post.PostStatusChange.OPEN,
    ):
        grouped_notifications[notification.recipient][notification.type].append(
            notification
        )

    _send_grouped_notifications(grouped_notifications)


def _send_grouped_notifications(grouped_notifications):
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
