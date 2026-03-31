import logging

import dramatiq
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@dramatiq.actor
def send_email_async(*args, recipient_list: list[str], **kwargs):
    if recipient_list:
        send_mail(*args, recipient_list=recipient_list, **kwargs)
