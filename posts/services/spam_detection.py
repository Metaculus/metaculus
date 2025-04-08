from posts.models import Post
from users.models import User, UserSpamActivity
from users.services.spam_detection import (
    check_and_handle_content_spam,
)
from utils.frontend import build_frontend_url


def check_and_handle_post_spam(author: User, post: Post) -> bool:
    recipients = User.objects.filter(is_staff=True)

    content = ""
    content_admin_url = build_frontend_url(f"/admin/posts/post/{post.id}/change/")
    if post.notebook is not None:
        content = post.notebook.markdown or ""
        content_admin_url = build_frontend_url(
            f"/admin/posts/notebook/{post.notebook.id}/change/"
        )
    elif post.question is not None:
        content_admin_url = build_frontend_url(
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

    content_frontend_url = build_frontend_url(f"/questions/{post.id}/")

    return check_and_handle_content_spam(
        author=author,
        content_text=content,
        content_id=post.id,
        content_type=(
            UserSpamActivity.SpamContentType.NOTEBOOK
            if post.notebook
            else UserSpamActivity.SpamContentType.QUESTION
        ),
        content_admin_url=content_admin_url,
        content_frontend_url=content_frontend_url,
        admin_emails=[x.email for x in recipients],
        email_content_quote=post.title,
    )
