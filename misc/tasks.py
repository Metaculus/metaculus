import logging

import dramatiq
from django.core.mail import send_mail

from .services.stats import get_cached_site_stats

logger = logging.getLogger(__name__)


@dramatiq.actor
def send_email_async(*args, recipient_list: list[str], **kwargs):
    if recipient_list:
        send_mail(*args, recipient_list=recipient_list, **kwargs)


@dramatiq.actor
def warm_cache_site_stats() -> None:
    get_cached_site_stats.refresh_cache()
