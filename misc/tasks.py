import logging

import dramatiq
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@dramatiq.actor
def send_email_async(*args, **kwargs):
    send_mail(*args, **kwargs)
