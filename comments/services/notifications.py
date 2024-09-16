from comments.models import Comment
from notifications.constants import MailingTags
from notifications.services import NotificationNewComments, NotificationPostParams
from ..utils import comment_extract_user_mentions


def notify_mentioned_users(comment: Comment):
    users, _ = comment_extract_user_mentions(comment)

    users = (
        users.exclude(pk=comment.author_id)
        # Exclude users with disabled notifications
        .exclude(unsubscribed_mailing_tags__contains=[MailingTags.COMMENT_MENTIONS])
    )

    for user in users:
        NotificationNewComments.send(
            user,
            NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(comment.on_post),
                new_comments_count=1,
                new_comment_ids=[comment.id],
            ),
        )
