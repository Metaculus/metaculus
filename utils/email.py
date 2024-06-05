import logging

from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .tasks import actor_send_mail

logger = logging.getLogger(__name__)


def send_email_with_template(to: str, subject: str, template_name: str, context=None):
    convert_to_html_content = render_to_string(
        template_name=template_name, context=context
    )
    plain_message = strip_tags(convert_to_html_content)

    actor_send_mail.send(
        subject=subject,
        message=plain_message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[to],
        html_message=convert_to_html_content,
    )
