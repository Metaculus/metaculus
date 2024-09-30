from urllib.parse import urlencode

from django.conf import settings
from django.utils.text import slugify


def build_frontend_url(path: str = None):
    base_url = settings.FRONTEND_BASE_URL.strip().rstrip("/")
    path = path.strip().lstrip("/") if path else ""

    return f"{base_url}/{path}"


def build_frontend_account_activation_url(user_id: int, token: str):
    return build_frontend_url(
        f"/accounts/activate?{urlencode({'user_id': user_id, 'token': token})}"
    )


def build_frontend_password_reset_url(user_id: int, token: str):
    return build_frontend_url(
        f"/accounts/reset?{urlencode({'user_id': user_id, 'token': token})}"
    )


def build_question_graph_image_url(question_id: int):
    return build_frontend_url(f"/api/posts/preview-image/{question_id}/")


def build_question_graph_image_cdn_url(question_id: int):
    cdn_domain_name = settings.CDN_DOMAIN_NAME.strip().rstrip("/")
    return f"{cdn_domain_name}/api/posts/preview-image/{question_id}/"


def build_question_embed_url(question_id: int):
    return build_frontend_url(f"/questions/embed/{question_id}")


def build_post_comment_url(post_id: int, post_title: str, comment_id: int):
    return build_frontend_url(
        f"/questions/{post_id}/{slugify(post_title)}#comment-{comment_id}"
    )


def build_frontend_email_change_url(token: str):
    return build_frontend_url(f"/accounts/change-email?{urlencode({'token': token})}")
