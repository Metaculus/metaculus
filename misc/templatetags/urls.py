from django import template
from django.template.defaultfilters import slugify

from utils.frontend import (
    build_frontend_url as _build_frontend_url,
    build_question_graph_image_cdn_url as _build_question_graph_image_url,
    build_user_profile_url as _build_user_profile_url,
)

register = template.Library()


@register.simple_tag
def build_frontend_url(path):
    """
    Generates a frontend url for the given path
    """

    return _build_frontend_url(path)


@register.simple_tag
def build_question_graph_image_url(post_id: int):
    return _build_question_graph_image_url(post_id)


@register.simple_tag
def post_url(
    post_id: int, post_title: str, subquestion_id: int = None, post_type: int = None
):
    url = f"/questions/{post_id}/{slugify(post_title)}"

    if post_type == "group_of_questions" and subquestion_id:
        url = f"{url}?sub-question={subquestion_id}"

    return _build_frontend_url(url)


@register.simple_tag
def tag_notification_settings_url():
    return _build_frontend_url("/accounts/settings/notifications/")


@register.simple_tag
def build_user_profile_url(user_id: int):
    return _build_user_profile_url(user_id)
