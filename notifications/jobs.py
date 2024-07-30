from collections import defaultdict

import dramatiq

from notifications.models import Notification
from notifications.services import get_notification_handler_by_type


@dramatiq.actor
def job_send_notification_groups():
    """
    Aggregates and sends grouped notifications to the recipients
    """

    # { user_id: { NotificationType: list[Notification] } }
    grouped_notifications = defaultdict(lambda: defaultdict(list))

    # Grouping notifications
    for notifications in Notification.objects.filter(email_sent=False):
        grouped_notifications[notifications.recipient][notifications.type].append(
            notifications
        )

    # Running notifications scheduling
    for recipient, groups in grouped_notifications.items():
        for notification_type, notifications in groups.items():
            handler_cls = get_notification_handler_by_type(notification_type)

            # Send group of notifications
            handler_cls.send_group(notifications)

            # Mark as sent
            for notification in notifications:
                notification.mark_as_sent()
                notification.save()
