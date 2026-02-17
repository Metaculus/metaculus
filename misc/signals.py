import logging

from anymail.exceptions import AnymailCancelSend
from anymail.signals import pre_send
from django.conf import settings
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(pre_send)
def handle_pre_send(sender, message, **kwargs):
    """
    Anymail pre-send signal handler that centralizes email processing:
    - Adds environment prefix to subject for dev/play environments
    - Redirects all mail to SEND_ALL_MAIL_TO when configured
    - Filters non-staff recipients when EMAIL_ALLOW_SEND_TO_ALL_USERS is False
    """
    # Add environment prefix to subject
    if settings.METACULUS_ENV in ("dev", "play"):
        message.subject = f"[{settings.METACULUS_ENV}] {message.subject}"

    # Redirect all mail when SEND_ALL_MAIL_TO is configured
    if settings.SEND_ALL_MAIL_TO:
        message.to = [settings.SEND_ALL_MAIL_TO]
        message.cc = []
        message.bcc = []
        return

    # Filter recipients to staff-only when not allowed to send to all users
    if not settings.EMAIL_ALLOW_SEND_TO_ALL_USERS:
        from users.models import User

        staff_emails = set(
            email.lower()
            for email in User.objects.filter(is_staff=True).values_list(
                "email", flat=True
            )
        )

        message.to = _filter_staff(message.to, staff_emails)
        message.cc = _filter_staff(message.cc, staff_emails)
        message.bcc = _filter_staff(message.bcc, staff_emails)

        # Cancel sending if no recipients remain
        if not message.to and not message.cc and not message.bcc:
            raise AnymailCancelSend("No staff recipients")


def _filter_staff(emails: list[str], staff_emails: set[str]) -> list[str]:
    return [
        email
        for email in emails
        if email.lower() in staff_emails or email.lower().endswith("@metaculus.com")
    ]
