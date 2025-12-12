import logging
from collections import defaultdict

import dramatiq

from notifications.models import Notification
from notifications.services import get_notification_handler_by_type
from posts.models import Post

logger = logging.getLogger(__name__)


@dramatiq.actor
def job_send_notification_groups():
    """
    Aggregates and sends grouped notifications to the recipients
    """

    # { user_id: { NotificationType: list[Notification] } }
    grouped_notifications = defaultdict(lambda: defaultdict(list))

    # Grouping notifications
    for notifications in Notification.objects.filter(
        email_sent=False, read_at__isnull=True
    ):
        # Skip notifications for deleted posts
        # Note: We still allow comment mention notifications through since those
        # are sent separately via send_comment_mention_notification()
        params = notifications.params or {}
        post_data = params.get("post")

        if post_data and post_data.get("post_id"):
            try:
                post = Post.objects.get(id=post_data["post_id"])
                if post.curation_status == Post.CurationStatus.DELETED:
                    # Mark as sent to avoid retrying, but don't actually send
                    notifications.mark_as_sent()
                    notifications.save()
                    continue
            except Post.DoesNotExist:
                # Post was deleted from database entirely
                notifications.mark_as_sent()
                notifications.save()
                continue

        grouped_notifications[notifications.recipient][notifications.type].append(
            notifications
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
