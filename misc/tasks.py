import logging

import dramatiq
from django.core.mail import send_mail

from .services.stats import get_cached_site_stats

logger = logging.getLogger(__name__)


@dramatiq.actor
def send_email_async(*args, recipient_list: list[str], **kwargs):
    recipient_list = recipient_list or []
    recipients = [email for email in recipient_list if email and email.strip()]

    if excluded := len(recipient_list) - len(recipients):
        logger.warning(
            f"send_email_async: excluded {excluded} empty recipient(s), "
            f"subject: {kwargs.get('subject')}"
        )

    if recipients:
        send_mail(*args, recipient_list=recipients, **kwargs)


@dramatiq.actor
def warm_cache_site_stats() -> None:
    get_cached_site_stats.refresh_cache()
