from datetime import date

from django.db.models import Q

from comments.models import Comment
from comments.models import CommentsOfTheWeekEntry
from notifications.constants import MailingTags
from notifications.services import send_comment_mention_notification
from notifications.utils import generate_email_comment_preview_text
from users.models import User
from utils.email import send_email_with_template
from utils.frontend import build_frontend_url, build_post_url
from ..utils import comment_extract_user_mentions, get_mention_for_user
from django.conf import settings


def notify_mentioned_users(comment: Comment):
    users, unique_mentions = comment_extract_user_mentions(comment)

    users = (
        users.exclude(pk=comment.author_id)
        # Exclude users with disabled notifications
        .exclude(unsubscribed_mailing_tags__contains=[MailingTags.COMMENT_MENTIONS])
    )

    for user in users:
        mention = get_mention_for_user(user, unique_mentions)
        send_comment_mention_notification(user, comment, mention)


def notify_weekly_top_comments_subscribers(
    week_start_date: date,
    batch_size: int = 300,
):
    entries = (
        CommentsOfTheWeekEntry.objects.filter(
            week_start_date=week_start_date, excluded=False
        )
        .select_related("comment", "comment__author", "comment__on_post")
        .order_by("-score", "comment__created_at")
    )

    top_comments = [
        {
            "created_at": e.comment.created_at,
            "author": e.comment.author.username,
            "post_title": e.comment.on_post.title,
            "post_url": build_post_url(e.comment.on_post),
            "preview_text": generate_email_comment_preview_text(
                e.comment.text, max_chars=512
            )[0],
        }
        for e in entries[:3]
    ]

    if not top_comments:
        return

    top_comments_url = build_frontend_url(
        f"/questions/?weekly_top_comments=true&start_date={week_start_date.isoformat()}"
    )

    other_usernames_list = [e.comment.author.username for e in entries[3:6]]
    if len(other_usernames_list) > 2:
        other_usernames = (
            ", ".join(other_usernames_list[:-1]) + f" and {other_usernames_list[-1]}"
        )
    else:
        other_usernames = ", ".join(other_usernames_list)

    recipients_qs = (
        User.objects.exclude(
            Q(unsubscribed_mailing_tags__contains=[MailingTags.WEEKLY_TOP_COMMENTS])
        )
        .exclude(email__isnull=True)
        .exclude(email="")
        .values_list("email", flat=True)
        .order_by("id")
    )

    start = 0
    while True:
        emails_batch = list(recipients_qs[start : start + batch_size])
        if not emails_batch:
            break

        send_email_with_template(
            to=emails_batch,
            subject="Last week’s top Metaculus comments",
            template_name="emails/weekly_top_comments.html",
            context={
                "top_comments": top_comments,
                "top_comments_url": top_comments_url,
                "other_usernames": other_usernames,
            },
            use_async=False,
            from_email=settings.EMAIL_NOTIFICATIONS_USER,
        )
        start += batch_size
