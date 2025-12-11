import logging

import dramatiq
from django.conf import settings
from django.core.mail import send_mail

from users.models import User

logger = logging.getLogger(__name__)


def add_env_prefix_to_subject(subject: str) -> str:
    """Add environment prefix to email subject for dev/play environments."""
    if settings.METACULUS_ENV in ["dev", "play"]:
        return f"[{settings.METACULUS_ENV}] {subject}"
    return subject


def filter_staff_emails(emails: list[str]) -> list:
    """
    Filters only User.is_staff or *@metaculus.com emails
    """

    staff_emails = [
        x.lower()
        for x in User.objects.filter(is_staff=True).values_list("email", flat=True)
    ]
    filtered_emails = []

    for email in emails:
        if email.lower() in staff_emails or email.lower().endswith("@metaculus.com"):
            filtered_emails.append(email)

    return filtered_emails


@dramatiq.actor
def send_email_async(*args, recipient_list: list[str], subject: str = "", **kwargs):
    subject = add_env_prefix_to_subject(subject)

    recipient_list = (
        recipient_list
        if settings.EMAIL_ALLOW_SEND_TO_ALL_USERS
        else filter_staff_emails(recipient_list)
    )

    if recipient_list:
        send_mail(*args, recipient_list=recipient_list, subject=subject, **kwargs)
