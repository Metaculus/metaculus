import hashlib
import logging
from collections import defaultdict

from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from misc.tasks import send_email_async

logger = logging.getLogger(__name__)

# Sending-domain warm-up ramp, per stream: the percentage (0-100) of recipients
# routed to the new domain. Advance the warm-up by bumping these in code.
NOTIFICATIONS_DOMAIN_RAMP_PCT = 10
ACCOUNTS_DOMAIN_RAMP_PCT = 0
# @metaculus.com staff dogfood the new domain at these splits, independent of
# the public ramp above, so the team sees the new domain early.
NOTIFICATIONS_INTERNAL_RAMP_PCT = 50
ACCOUNTS_INTERNAL_RAMP_PCT = 0


def resolve_warmup_sender(
    recipient: str,
    *,
    legacy_sender: str,
    new_sender: str,
    ramp_pct: int,
    internal_ramp_pct: int,
) -> str:
    """
    Picks a stream's "From" address for a recipient during a sending-domain
    warm-up, shifting traffic onto new_sender as ramp_pct grows. A recipient's
    bucket is stable, so the assignment never flip-flops. Internal
    @metaculus.com addresses use internal_ramp_pct so staff can dogfood the new
    domain independently of the public ramp.
    """
    recipient = recipient.strip().lower()
    pct = internal_ramp_pct if recipient.endswith("@metaculus.com") else ramp_pct

    digest = hashlib.md5(f"notifications-warmup:{recipient}".encode()).hexdigest()
    bucket = int(digest, 16) % 100

    return new_sender if bucket < pct else legacy_sender


def resolve_notification_sender(recipient: str) -> str:
    return resolve_warmup_sender(
        recipient,
        legacy_sender=settings.EMAIL_NOTIFICATIONS_USER,
        new_sender=settings.EMAIL_NOTIFICATIONS_SENDER,
        ramp_pct=NOTIFICATIONS_DOMAIN_RAMP_PCT,
        internal_ramp_pct=NOTIFICATIONS_INTERNAL_RAMP_PCT,
    )


def resolve_account_sender(recipient: str) -> str:
    return resolve_warmup_sender(
        recipient,
        legacy_sender=settings.EMAIL_HOST_USER,
        new_sender=settings.EMAIL_ACCOUNTS_SENDER,
        ramp_pct=ACCOUNTS_DOMAIN_RAMP_PCT,
        internal_ramp_pct=ACCOUNTS_INTERNAL_RAMP_PCT,
    )


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


def _send_stream_email(to, subject, template_name, context, use_async, resolver):
    """
    Sends a stream email, routing each recipient to its warm-up sending domain
    via `resolver`. Recipients are grouped by resolved sender so a single call
    spanning both domains still produces correctly-attributed messages.
    """
    to = [to] if isinstance(to, str) else list(to)

    by_sender: dict[str, list[str]] = defaultdict(list)
    for recipient in to:
        by_sender[resolver(recipient)].append(recipient)

    for sender, recipients in by_sender.items():
        send_email_with_template(
            recipients,
            subject,
            template_name,
            context=context,
            use_async=use_async,
            from_email=sender,
        )


def send_notification_email_with_template(
    to: list[str] | str,
    subject: str,
    template_name: str,
    context: dict = None,
    use_async: bool = True,
):
    """Sends a notification-stream email."""
    _send_stream_email(
        to, subject, template_name, context, use_async, resolve_notification_sender
    )


def send_account_email_with_template(
    to: list[str] | str,
    subject: str,
    template_name: str,
    context: dict = None,
    use_async: bool = True,
):
    """Sends an account-stream (transactional) email."""
    _send_stream_email(
        to, subject, template_name, context, use_async, resolve_account_sender
    )
