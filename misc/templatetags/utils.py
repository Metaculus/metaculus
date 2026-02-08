import itertools

from django import template

from posts.models import Post

register = template.Library()


@register.filter
def post_status_label(value):
    """
    Convert a raw post status value (e.g. "cp_revealed") to its human-friendly label
    (e.g. "CP Revealed").
    """
    try:
        return Post.PostStatusChange(value).label
    except ValueError:
        return value


@register.filter
def chunks(value, chunk_length):
    """
    Breaks a list up into a list of lists of size <chunk_length>
    """

    clen = int(chunk_length)
    i = iter(value)
    while True:
        chunk = list(itertools.islice(i, clen))
        if chunk:
            yield chunk
        else:
            break
