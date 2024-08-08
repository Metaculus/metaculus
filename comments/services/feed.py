from django.db.models import Q


def get_comments_feed(
    qs, user, parent_isnull=None, post=None, author=None, sort=None
):
    # TODO: ensure user has access to all feed comments!!!
    # TODO: validate on_post_id!!!!

    if parent_isnull is not None:
        qs = qs.filter(parent=None)

    if post is not None:
        qs = qs.filter(on_post=post)

    if author is not None:
        qs = qs.filter(author_id=author)

    if user.is_anonymous:
        qs = qs.filter(is_private=False)
    else:
        qs = qs.filter(Q(is_private=False) | Q(author=user))

    qs = qs.annotate_vote_score()

    if sort:
        qs = qs.order_by(sort)

    return qs
