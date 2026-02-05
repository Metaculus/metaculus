from django.db.models import Q, Case, When, Value, IntegerField, Exists, OuterRef

from comments.models import Comment


def get_comments_feed(
    qs,
    user=None,
    parent_isnull=None,
    post=None,
    author=None,
    sort=None,
    is_private=None,
    focus_comment_id: int = None,
    include_deleted=False,
):
    user = user if user and user.is_authenticated else None
    sort = sort or "-created_at"
    order_by_args = []

    # Require at least one filter
    if not post and not author and not (is_private and user):
        return qs.none()

    if parent_isnull is not None:
        qs = qs.filter(parent=None)

    if post:
        qs = qs.filter(on_post=post)

        # Display pinned comments first if no sort param provided
        if sort == "-created_at":
            qs = qs.annotate(
                is_pinned_thread=Case(
                    When(Q(is_pinned=True) | Q(root__is_pinned=True), then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )

            order_by_args.append("-is_pinned_thread")

    if author is not None:
        qs = qs.filter(author_id=author)

    if is_private and user:
        qs = qs.filter(is_private=is_private, author=user)
    else:
        qs = qs.filter(is_private=False)

    if not include_deleted:
        qs = qs.filter(
            Q(is_soft_deleted=False)
            | Exists(
                Comment.objects.filter(parent_id=OuterRef("pk"), is_soft_deleted=False)
            )
        )

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
        if "vote_score" in sort:
            qs = qs.annotate_vote_score()

        order_by_args.append(sort)

    if order_by_args:
        qs = qs.order_by(*order_by_args)

    return qs
