import dramatiq

from comments.models import Comment
from comments.services.notifications import notify_mentioned_users
from posts.services.subscriptions import notify_new_comments


@dramatiq.actor
def run_on_post_comment_create(comment_id: int):
    comment = Comment.objects.get(id=comment_id)
    post = comment.on_post

    # Notify mentioned users
    notify_mentioned_users(comment)

    # Notify new comments
    notify_new_comments(post)
