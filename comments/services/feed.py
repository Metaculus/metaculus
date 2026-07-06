from datetime import datetime, timedelta

from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import F, Q, Case, When, Value, IntegerField, Exists, OuterRef
from django.utils import timezone

from comments.constants import TimeWindow
from comments.models import Comment
from posts.models import Post
from projects.models import Project

TIME_WINDOW_DELTAS = {
    TimeWindow.PAST_WEEK: timedelta(days=7),
    TimeWindow.PAST_MONTH: timedelta(days=30),
    TimeWindow.PAST_YEAR: timedelta(days=365),
}


def get_comments_feed(
    qs,
    user=None,
    parent_isnull=None,
    post=None,
    author=None,
    author_is_staff=None,
    sort=None,
    is_private=None,
    focus_comment_id: int = None,
    include_deleted: bool | None = None,
    last_viewed_at: datetime = None,
    time_window: str = None,
    search: str = None,
    exclude_bots: bool = False,
    exclude_bots_only_project: bool = False,
    post_status: Post.CurationStatus | None = None,
):
    user = user if user and user.is_authenticated else None
    sort = sort or "-created_at"
    order_by_args = []

    if post_status:
        qs = qs.filter(on_post__curation_status=post_status)

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

        # Prioritize threads with unread comments for the current user
        if last_viewed_at:
            unread_comments = Comment.objects.filter(
                on_post=post,
                created_at__gt=last_viewed_at,
                is_soft_deleted=False,
                is_private=False,
            )
            unread_root_ids = {
                root_id or comment_id
                for root_id, comment_id in unread_comments.values_list("root_id", "id")
            }

            if unread_root_ids:
                qs = qs.annotate(
                    has_unread_thread=Case(
                        When(
                            Q(pk__in=unread_root_ids) | Q(root_id__in=unread_root_ids),
                            then=Value(1),
                        ),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                )
                order_by_args.append("-has_unread_thread")

    # author and author_is_staff are treated as OR conditions
    if author is not None and author_is_staff:
        qs = qs.filter(Q(author_id=author) | Q(author__is_staff=True, parent=None))
    elif author is not None:
        qs = qs.filter(author_id=author)
    elif author_is_staff:
        qs = qs.filter(author__is_staff=True, parent=None)

    if is_private and user:
        qs = qs.filter(is_private=is_private, author=user)
    else:
        qs = qs.filter(is_private=False)

    if exclude_bots:
        qs = qs.filter(author__is_bot=False)

    if exclude_bots_only_project:
        qs = qs.exclude(
            on_post__default_project__bot_leaderboard_status=Project.BotLeaderboardStatus.BOTS_ONLY
        )

    if include_deleted is None:
        qs = qs.filter(
            Q(is_soft_deleted=False)
            | Exists(
                Comment.objects.filter(parent_id=OuterRef("pk"), is_soft_deleted=False)
            )
        )

    if include_deleted is False:
        qs = qs.filter(is_soft_deleted=False)

    # Time window filter
    if time_window and time_window in TIME_WINDOW_DELTAS:
        cutoff = timezone.now() - TIME_WINDOW_DELTAS[time_window]
        qs = qs.filter(created_at__gte=cutoff)

    # Full-text search using stored search vector
    if search:
        query = SearchQuery(search, search_type="websearch", config="english")
        qs = qs.filter(text_original_search_vector=query)
        if sort == "relevance":
            qs = qs.annotate(
                search_rank=SearchRank(F("text_original_search_vector"), query)
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
            # Insert after pinned but before unread prioritization
            # so focused comment always appears on the first page
            pinned_idx = (
                order_by_args.index("-is_pinned_thread") + 1
                if "-is_pinned_thread" in order_by_args
                else 0
            )
            order_by_args.insert(pinned_idx, "-is_focused_comment")

    if sort:
        if sort == "relevance":
            order_by_args.append("-search_rank")
        else:
            order_by_args.append(sort)

    if order_by_args:
        qs = qs.order_by(*order_by_args)

    return qs
