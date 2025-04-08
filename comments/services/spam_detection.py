from comments.models import Comment
from users.models import User, UserSpamActivity
from users.services.spam_detection import check_and_handle_content_spam
from utils.frontend import build_frontend_url


def check_and_handle_comment_spam(author: User, comment: Comment) -> bool:

    private_note = comment.is_private
    private_post = comment.on_post.is_private() if comment.on_post else None
    if private_note or private_post:
        return False

    recipients = User.objects.filter(is_staff=True)

    return check_and_handle_content_spam(
        author=author,
        content_text=comment.text,
        content_id=comment.id,
        content_type=UserSpamActivity.SpamContentType.COMMENT,
        content_url=build_frontend_url(f"/admin/comments/comment/{comment.id}/change/"),
        admin_emails=[x.email for x in recipients],
    )
