from django.db import models

from utils.models import TimeStampedModel


class Notification(TimeStampedModel):
    """
    Platform notifications.
    Will be used to display in-app notifications AND for sending batch emails once per hour
    (stack notifications of the same type)
    """

    type = models.CharField(db_index=True)
    # Recipient of the notification
    recipient = models.ForeignKey(
        "users.User", models.CASCADE, related_name="notifications"
    )

    params = models.JSONField()
    read_at = models.DateTimeField(null=True, db_index=True)

    email_sent = models.BooleanField(default=False, db_index=True)

    def mark_as_sent(self):
        self.email_sent = True
