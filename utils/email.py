import logging

from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from metaculus_web.settings import SEND_ALL_MAIL_TO
from misc.tasks import send_email_async

logger = logging.getLogger(__name__)


def send_email_with_template(
    to: list[str] | str,
    subject: str,
    template_name: str,
    context: dict = None,
    use_async: bool = True,
    from_email=None,
):
    # Add environment prefix to subject for dev/play environments
    if settings.METACULUS_ENV in ["dev", "play"]:
        subject = f"[{settings.METACULUS_ENV}] {subject}"

    # Add subject to context so it can be displayed in email header
    if context is None:
        context = {}
    context["email_subject"] = subject

    convert_to_html_content = render_to_string(
        template_name=template_name, context=context
    )
    plain_message = strip_tags(convert_to_html_content)

    if SEND_ALL_MAIL_TO:
        to = SEND_ALL_MAIL_TO

    to = [to] if isinstance(to, str) else list(to)

    kwargs = dict(
        subject=str(subject),
        message=plain_message,
        from_email=from_email or settings.EMAIL_HOST_USER,
        recipient_list=to,
        html_message=convert_to_html_content,
    )

    if use_async:
        send_email_async.send(**kwargs)
    else:
        try:
            send_email_async(**kwargs)
        except Exception:
            logger.exception("Failed to send email")
