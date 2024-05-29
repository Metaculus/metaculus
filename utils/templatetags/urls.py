from django import template

from utils.frontend import build_frontend_url as _build_frontend_url

register = template.Library()


@register.filter(name="build_frontend_url")
def build_frontend_url(path):
    """
    Generates a frontend url for the given path
    """

    return _build_frontend_url(path)
