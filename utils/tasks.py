import logging

import dramatiq
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@dramatiq.actor
def actor_send_mail(*args, **kwargs):
    send_mail(*args, **kwargs)
