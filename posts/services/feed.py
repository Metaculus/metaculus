from datetime import timedelta
from typing import Iterable

from django.db.models import Q, QuerySet
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied

from posts.models import Post, Vote
from posts.serializers import PostFilterSerializer
from posts.services.search import (
    perform_post_search,
    qs_filter_similar_posts,
    posts_full_text_search,
)
from projects.models import Project
from questions.models import Question
from users.models import User
from utils.cache import cache_get_or_set
from utils.dtypes import evenly_distribute_items
from utils.models import build_order_by
from utils.serializers import parse_order_by


def get_posts_feed(
    qs: Post.objects = None,
    user: User = None,
    search: str = None,
    default_project_id: int = None,
    for_consumer_view: bool = False,
    topic: Project = None,
    community: Project = None,
    leaderboard_tags: list[Project] = None,
    categories: list[Project] = None,
    tournaments: list[Project] = None,
    forecast_type: list[str] = None,
    statuses: list[str] = None,
    order_by: str = None,
    access: PostFilterSerializer.Access = None,
    ids: list[int] = None,
    news_type: list[Project] = None,
    curation_status: Post.CurationStatus = None,
    usernames: list[str] = None,
    forecaster_id: int = None,
    withdrawn: bool = None,
    not_forecaster_id: int = None,
    similar_to_post_id: int = None,
    for_main_feed: bool = None,
    show_on_homepage: bool = None,
    following: bool = None,
    upvoted_by: int = None,
    **kwargs,
) -> Post.objects:
    """
    Applies filtering on the Questions QuerySet
    """

    # Ensure we could only filter by current user
    if forecaster_id and (not user or forecaster_id != user.id):
        raise PermissionDenied()

    if not_forecaster_id and (not user or not_forecaster_id != user.id):
        raise PermissionDenied()

    if qs is None:
        qs = Post.objects.all()

    # If ids provided
    if ids:
        qs = qs.filter(id__in=ids)

    # Apply consumer views filter
    if for_consumer_view:
        qs = filter_for_consumer_view(qs)

    # Exclude Deleted posts
    qs = qs.exclude(curation_status=Post.CurationStatus.DELETED)

    # Filter by permission level
    qs = qs.filter_permission(user=user)

    # Author usernames
    if usernames:
        qs = qs.filter(author__username__in=usernames)

    # Filters
    if default_project_id:
        qs = qs.filter(default_project_id=default_project_id)

    if topic:
        qs = qs.filter_projects(topic)

    if community:
        qs = qs.filter_projects(community)

    if leaderboard_tags:
        qs = qs.filter_projects(leaderboard_tags)

    if categories:
        qs = qs.filter_projects(categories)

    if news_type:
        qs = qs.filter_projects(news_type)

    if tournaments:
        qs = qs.filter_projects(tournaments)

    if for_main_feed:
        qs = qs.filter_for_main_feed()

    if show_on_homepage:
        qs = qs.filter(show_on_homepage=True)

    if curation_status:
        qs = qs.filter(curation_status=curation_status)

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

    statuses = list(statuses or [])
    now = timezone.now()
    post_status_q = Q()
    question_status_q = Q()

    for status in statuses:
        if status in Post.CurationStatus:
            post_status_q |= Q(curation_status=status)
        if status == "open":
            post_status_q |= Q(
                Q(published_at__lte=now)
                & Q(curation_status=Post.CurationStatus.APPROVED)
                & (
                    Q(notebook_id__isnull=False)
                    | (
                        Q(open_time__lte=now)
                        & Q(
                            (
                                Q(actual_close_time__isnull=True)
                                | Q(actual_close_time__gte=now)
                            )
                            & Q(scheduled_close_time__gte=now)
                        )
                        & Q(resolved=False)
                    )
                ),
            )
        if status == "pending_resolution":
            if order_by in [None, "-" + PostFilterSerializer.Order.HOTNESS]:
                order_by = "-" + PostFilterSerializer.Order.SCHEDULED_RESOLVE_TIME

        # Subquestion statuses
        # Build a single combined filter for question-based statuses
        # This avoids multiple Exists subqueries that become expensive hashed SubPlans
        if status == "upcoming":
            question_status_q |= Q(open_time__gte=now)

        if status == "closed":
            question_status_q |= Q(
                resolution__isnull=True,
            ) & (Q(actual_close_time__isnull=False) | Q(scheduled_close_time__lte=now))

        if status == "resolved":
            question_status_q |= Q(resolution__isnull=False)

        if status == "pending_resolution":
            question_status_q |= Q(
                resolution__isnull=True,
                scheduled_resolve_time__lte=now,
            )

    # Get post IDs matching any of these question-based statuses
    if question_status_q:
        post_status_q |= Q(
            notebook__isnull=True,
            curation_status=Post.CurationStatus.APPROVED,
            pk__in=Question.objects.filter(question_status_q).values("post_id"),
        )

    # Include only approved posts if no curation status specified
    if not any(status in Post.CurationStatus for status in statuses):
        post_status_q &= Q(curation_status=Post.CurationStatus.APPROVED)

    qs = qs.filter(post_status_q)

    if forecaster_id:
        # Use Exists for efficient filtering (Semi Join), then annotate for display
        qs = qs.filter_user_has_forecasted(
            forecaster_id
        ).annotate_user_last_forecasts_date(forecaster_id)

        if order_by == PostFilterSerializer.Order.USER_NEXT_WITHDRAW_TIME:
            qs = qs.annotate_next_withdraw_time(forecaster_id)

        if withdrawn is not None:
            qs = qs.annotate_has_active_forecast(forecaster_id).filter(
                has_active_forecast=not withdrawn
            )

    if not_forecaster_id:
        qs = qs.filter_user_has_not_forecasted(not_forecaster_id)

    if upvoted_by:
        qs = qs.filter(
            votes__user=upvoted_by,
            votes__direction=Vote.VoteDirection.UP,
        )

    # Followed posts
    if user and user.is_authenticated and following:
        qs = qs.annotate_user_is_following(user=user).filter(user_is_following=True)

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
            q = Q(rank__gte=0.3)

            # Full-text search is currently not fully optimized.
            # To avoid overloading the database, it is applied only to filtered and narrowed queries.
            if tournaments:
                q = Q(rank__gte=0.4) | Q(pk__in=posts_full_text_search(qs, search))

            qs = qs.filter(q)

    # Other filters
    qs = qs.filter(**kwargs)

    order_by = order_by or "-created_at"

    # Ordering
    order_desc, order_type = parse_order_by(order_by)

    if (
        order_type
        in [
            PostFilterSerializer.Order.USER_LAST_FORECASTS_DATE,
            PostFilterSerializer.Order.USER_NEXT_WITHDRAW_TIME,
        ]
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
        qs = qs.filter(
            scheduled_resolve_time__isnull=False,
            resolved=False,
            curation_status=Post.CurationStatus.APPROVED,
        )
    if order_type == PostFilterSerializer.Order.NEWS_HOTNESS:
        if not order_desc:
            raise ValidationError('Ascending is not supported for "In the news" order')

        # Annotate news hotness and exclude notebooks
        qs = qs.annotate_news_hotness().filter(notebook__isnull=True)

        # Include questions with actual close time in the past 7 days,
        # so that when the "open" filter is unselected you see
        # actually trending stuff that resolved instead of a bunch of old outdated stuff
        qs = qs.filter(
            Q(actual_close_time__isnull=True)
            | Q(actual_close_time__gte=timezone.now() - timedelta(days=7))
        )

    qs = qs.order_by(build_order_by(order_type, order_desc))

    return qs.distinct("id", order_type).only("pk")


def filter_for_consumer_view(qs: QuerySet[Post]) -> QuerySet[Post]:
    """
    A special filter applied to default Consumer View feed representation
    https://github.com/Metaculus/metaculus/issues/3377
    """

    now = timezone.now()

    allowed_projects = list(
        Project.objects.filter(
            type=Project.ProjectTypes.NEWS_CATEGORY,
            slug__in=["programs", "research"],
        )
    )

    # Display only programs/research notebooks
    qs = qs.filter(
        Q(default_project__in=allowed_projects)
        | Q(notebook__isnull=True)
        | Q(projects__in=allowed_projects)
    )

    # We should keep posts where at least one question has CP revealed.
    # For group questions, also check they're still open.
    qs = qs.filter(
        Q(notebook__isnull=False) |
        Q(pk__in=Question.objects.filter(
            Q(group__isnull=True)
            | Q(
                Q(actual_resolve_time__isnull=True) | Q(actual_resolve_time__gte=now),
                Q(actual_close_time__isnull=True) | Q(actual_close_time__gte=now),
            ),
            cp_reveal_time__lt=now,
        ).values("post_id"))
    )

    # Exclude resolved questions
    qs = qs.exclude(resolved=True)

    return qs


def get_similar_posts(post: Post):
    return cache_get_or_set(
        f"get_similar_questions:v2:{post.id}",
        lambda: [
            p.pk
            for p in get_posts_feed(
                # Exclude conditional
                # Since we don't have a compact tile to display here
                Post.objects.filter(conditional__isnull=True, notebook__isnull=True),
                similar_to_post_id=post.id,
                statuses=["open"],
                for_main_feed=True,
            )[:8]
        ],
        # 24h
        timeout=3600 * 24,
        version=2,
    )


def get_similar_posts_for_posts(posts: Iterable[Post], n: int = 4):
    similar_post_chunks = [get_similar_posts(post) for post in posts[:2]]

    return evenly_distribute_items(similar_post_chunks, n)
