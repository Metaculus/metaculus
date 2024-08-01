from django import template
from django.template.defaultfilters import slugify

from utils.frontend import (
    build_frontend_url as _build_frontend_url,
    build_question_graph_image_url as _build_question_graph_image_url,
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
def post_url(post_id: int, post_title: str):
    return _build_frontend_url(f"/questions/{post_id}/{slugify(post_title)}")


@register.simple_tag
def tag_unsubscribe_url():
    # TODO:
    return "https://google.com"


@register.simple_tag
def tag_settings_url():
    return _build_frontend_url("/accounts/settings/")
