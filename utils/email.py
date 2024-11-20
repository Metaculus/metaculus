import logging

from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import dramatiq
from django.core.mail import send_mail

from metaculus_web.settings import SEND_ALL_MAIL_TO

logger = logging.getLogger(__name__)


def send_email_with_template(
    to: str,
    subject: str,
    template_name: str,
    context: dict | None = None,
    use_async: bool = True,
) -> None:
    convert_to_html_content = render_to_string(
        template_name=template_name, context=context
    )
    plain_message = strip_tags(convert_to_html_content)

    if SEND_ALL_MAIL_TO:
        to = SEND_ALL_MAIL_TO

    kwargs = dict(
        subject=str(subject),
        message=plain_message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[to],
        html_message=convert_to_html_content,
    )

    if use_async:
        send_email_async.send(**kwargs)
    else:
        send_email_async(**kwargs)


@dramatiq.actor
def send_email_async(*args, recipient_list: list[str], **kwargs) -> None:
    recipient_list = (
        recipient_list
        if settings.EMAIL_ALLOW_SEND_TO_ALL_USERS
        else filter_staff_emails(recipient_list)
    )

    if recipient_list:
        send_mail(*args, recipient_list=recipient_list, **kwargs)


def filter_staff_emails(emails: list[str]) -> list:
    """
    Filters only User.is_staff or *@metaculus.com emails
    """
    filtered_emails = []

    for email in emails:
        if email.lower().endswith("@metaculus.com"):
            filtered_emails.append(email)

    return filtered_emails
