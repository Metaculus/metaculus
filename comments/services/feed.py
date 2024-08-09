from django.db.models import Q, Case, When, Value, IntegerField


def get_comments_feed(
    qs,
    user=None,
    parent_isnull=None,
    post=None,
    author=None,
    sort=None,
    focus_comment_id: int = None,
):
    user = user if user and user.is_authenticated else None

    if parent_isnull is not None:
        qs = qs.filter(parent=None)

    if post is not None:
        qs = qs.filter(on_post=post)

    if author is not None:
        qs = qs.filter(author_id=author)

    if user:
        qs = qs.filter(Q(is_private=False) | Q(author=user))
    else:
        qs = qs.filter(is_private=False)

    qs = qs.annotate_vote_score()

    order_by_args = []

    # Filter comments located under Posts current user is allowed to see
    qs = qs.filter_by_user_permission(user=user)

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
