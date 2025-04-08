from posts.models import Post
from users.models import User, UserSpamActivity
from users.services.spam_detection import (
    check_and_handle_content_spam,
)
from utils.frontend import build_frontend_url


def check_and_handle_post_spam(author: User, post: Post) -> bool:
    recipients = User.objects.filter(is_staff=True)

    content = ""
    content_url = build_frontend_url(f"/admin/posts/post/{post.id}/change/")
    if post.notebook is not None:
        content = post.notebook.markdown or ""
        content_url = build_frontend_url(
            f"/admin/posts/notebook/{post.notebook.id}/change/"
        )
    elif post.question is not None:
        content_url = build_frontend_url(
            f"/admin/questions/question/{post.question.id}/change/"
        )
        content = "\n".join(
            [
                post.question.description or "",
                post.question.resolution or "",
                post.question.resolution_criteria or "",
                post.question.fine_print or "",
            ]
        )

    return check_and_handle_content_spam(
        author=author,
        content_text=content,
        content_id=post.id,
        content_type=UserSpamActivity.SpamContentType.POST,
        content_url=content_url,
        admin_emails=[x.email for x in recipients],
    )
