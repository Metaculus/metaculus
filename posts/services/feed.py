from typing import Iterable

from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from posts.models import Notebook, Post
from posts.serializers import PostFilterSerializer
from posts.services.search import perform_post_search, qs_filter_similar_posts
from projects.models import Project
from projects.services.common import get_site_main_project
from users.models import User
from utils.cache import cache_get_or_set
from utils.dtypes import evenly_distribute_items
from utils.models import build_order_by
from utils.serializers import parse_order_by


def get_posts_feed(
    qs: Post.objects = None,
    user: User = None,
    search: str = None,
    topic: Project = None,
    community: Project = None,
    tags: list[Project] = None,
    categories: list[Project] = None,
    tournaments: list[Project] = None,
    forecast_type: list[str] = None,
    statuses: list[str] = None,
    order_by: str = None,
    access: PostFilterSerializer.Access = None,
    ids: list[int] = None,
    public_figure: Project = None,
    news_type: Project = None,
    curation_status: Post.CurationStatus = None,
    notebook_type: Notebook.NotebookType = None,
    usernames: list[str] = None,
    forecaster_id: int = None,
    not_forecaster_id: int = None,
    similar_to_post_id: int = None,
    for_main_feed: bool = None,
    show_on_homepage: bool = None,
    **kwargs,
) -> Post.objects:
    """
    Applies filtering on the Questions QuerySet
    """

    if qs is None:
        qs = Post.objects.all()

    # If ids provided
    if ids:
        qs = qs.filter(id__in=ids)

    # Filter by permission level
    qs = qs.filter_permission(user=user)

    # Author usernames
    if usernames:
        qs = qs.filter(author__username__in=usernames)

    # Filters
    if topic:
        qs = qs.filter_projects(topic)

    if community:
        qs = qs.filter_projects(community)

    if tags:
        qs = qs.filter_projects(tags)

    if categories:
        qs = qs.filter_projects(categories)

    if news_type:
        qs = qs.filter_projects(news_type)

    if public_figure:
        qs = qs.filter_projects(public_figure)

    if tournaments:
        qs = qs.filter_projects(tournaments)

    if for_main_feed:
        site_main_project = get_site_main_project()
        qs = qs.filter_projects(site_main_project)

    if show_on_homepage:
        qs = qs.filter(show_on_homepage=True)

    if curation_status:
        qs = qs.filter(curation_status=curation_status)

    if notebook_type:
        qs = qs.filter(notebook__isnull=False).filter(notebook__type=notebook_type)

    forecast_type = forecast_type or []
    forecast_type_q = Q()

    for f_type in forecast_type:
        match f_type:
            case "notebook":
                forecast_type_q |= Q(notebook__isnull=False)
            case "conditional":
                forecast_type_q |= Q(conditional__isnull=False)
            case "group_of_questions":
                forecast_type_q |= Q(group_of_questions__isnull=False)
            case other:
                forecast_type_q |= Q(question__type=other)

    qs = qs.filter(forecast_type_q)

    statuses = statuses or []

    q = Q()
    for status in statuses:
        if status in Post.CurationStatus:
            q |= Q(curation_status=status)
        if status == "upcoming":
            q |= Q(
                Q(curation_status=Post.CurationStatus.APPROVED)
                & (Q(published_at__gte=timezone.now()) | Q(published_at__isnull=True))
            )
        if status == "closed":
            q |= Q(actual_close_time__isnull=False, resolved=False) | Q(
                scheduled_close_time__lte=timezone.now(), resolved=False
            )
        if status == "resolved":
            q |= Q(resolved=True, curation_status=Post.CurationStatus.APPROVED)
        if status == "open":
            q |= Q(
                Q(published_at__lte=timezone.now())
                & Q(curation_status=Post.CurationStatus.APPROVED)
                & Q(
                    (
                        Q(actual_close_time__isnull=True)
                        | Q(actual_close_time__gte=timezone.now())
                    )
                    & Q(scheduled_close_time__gte=timezone.now())
                )
                & Q(resolved=False),
            )

            # Notebooks don't support statuses filter
            # So we add fallback condition list this
            q |= Q(notebook_id__isnull=False)

    qs = qs.filter(q)

    if forecaster_id:
        qs = qs.annotate_user_last_forecasts_date(forecaster_id).filter(
            user_last_forecasts_date__isnull=False
        )
    if not_forecaster_id:
        qs = qs.annotate_user_last_forecasts_date(not_forecaster_id).filter(
            user_last_forecasts_date__isnull=True
        )

    # Filter by access
    if access == PostFilterSerializer.Access.PRIVATE:
        qs = qs.filter_private()
    if access == PostFilterSerializer.Access.PUBLIC:
        qs = qs.filter_public()

    # Similar posts lookup
    if similar_to_post_id:
        try:
            similar_to_post = Post.objects.filter_permission(user).get(
                pk=similar_to_post_id
            )
        except Post.DoesNotExist:
            return Post.objects.none()

        qs = qs_filter_similar_posts(qs, similar_to_post)
        order_by = "-rank"

    # Search
    if search:
        qs = perform_post_search(qs, search)

        if not order_by:
            # Force ordering by search rank
            order_by = "-rank"
        else:
            qs = qs.filter(rank__gte=0.3)

    # Other filters
    qs = qs.filter(**kwargs)

    order_by = order_by or "-created_at"

    # Ordering
    order_desc, order_type = parse_order_by(order_by)

    if (
        order_type == PostFilterSerializer.Order.USER_LAST_FORECASTS_DATE
        and not forecaster_id
    ):
        order_type = "created_at"

    if order_type == PostFilterSerializer.Order.UNREAD_COMMENT_COUNT and user:
        qs = qs.annotate_unread_comment_count(user_id=user.id)
    if order_type == PostFilterSerializer.Order.SCORE:
        if not forecaster_id:
            raise ValidationError(
                "Can not order by score without forecaster_id provided"
            )

        qs = qs.annotate_score(forecaster_id, desc=order_desc)
    if order_type == PostFilterSerializer.Order.WEEKLY_MOVEMENT:
        order_type = "movement"
    if order_type == PostFilterSerializer.Order.DIVERGENCE:
        if not forecaster_id:
            raise ValidationError(
                "Can not order by score without forecaster_id provided"
            )

        qs = qs.annotate_divergence(forecaster_id)
    if order_type == PostFilterSerializer.Order.SCHEDULED_RESOLVE_TIME:
        qs = qs.filter(scheduled_resolve_time__gte=timezone.now())

    qs = qs.order_by(build_order_by(order_type, order_desc))

    return qs.distinct("id", order_type).only("pk")


def get_similar_posts(post: Post):
    return cache_get_or_set(
        f"get_similar_questions:v2:{post.id}",
        lambda: [
            p.pk
            for p in get_posts_feed(similar_to_post_id=post.id, statuses=["open"])[:8]
        ],
        # 24h
        timeout=3600 * 24,
        version=2,
    )


def get_similar_posts_for_posts(posts: Iterable[Post], n: int = 4):
    similar_post_chunks = [get_similar_posts(post) for post in posts[:2]]

    return evenly_distribute_items(similar_post_chunks, n)
