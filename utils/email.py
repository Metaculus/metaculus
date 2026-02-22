import logging

from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

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
    # Add subject to context so it can be displayed in email header
    if context is None:
        context = {}
    context["email_subject"] = subject

    convert_to_html_content = render_to_string(
        template_name=template_name, context=context
    )
    plain_message = strip_tags(convert_to_html_content)

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
