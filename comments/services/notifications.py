from comments.models import Comment
from notifications.constants import MailingTags
from notifications.services import send_comment_mention_notification
from ..utils import comment_extract_user_mentions, get_mention_for_user


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
