from comments.models import Comment
from notifications.services import NotificationNewComments, NotificationPostParams
from ..utils import comment_text_extract_user_mentions


def notify_mentioned_users(comment: Comment):
    users = comment_text_extract_user_mentions(comment.text).values()

    for user in users:
        NotificationNewComments.send(
            user,
            NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(comment.on_post),
                new_comments_count=1,
                new_comment_ids=[comment.id],
            ),
        )
