from django.db.models import Q, Case, When, Value, IntegerField


def get_comments_feed(
    qs,
    user,
    parent_isnull=None,
    post=None,
    author=None,
    sort=None,
    focus_comment_id: int = None,
):
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

    order_by_args = []

    # TODO: add final permissions/private_comments validation
    #   To filter out comments user does not have access to!
    #   So we wouldn't need to validate post_id/focus_comment_id separately

    if focus_comment_id is not None:
        focus_comment = qs.filter(id=focus_comment_id).first()

        if focus_comment:
            fc_q = Q(pk=focus_comment_id)

            # If child comment, fetch all other children + root comment
            if focus_comment.root_id:
                fc_q |= Q(pk=focus_comment.root_id) | Q(root_id=focus_comment.root_id)
            else:
                # Fetch all children
                fc_q |= Q(root_id=focus_comment_id)

            qs = qs.annotate(
                is_focused_comment=Case(
                    When(fc_q, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            order_by_args.append("-is_focused_comment")

    if sort:
        order_by_args.append(sort)

    if order_by_args:
        qs = qs.order_by(*order_by_args)

    return qs
