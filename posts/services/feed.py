from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from posts.models import Notebook, Post
from posts.serializers import PostFilterSerializer
from projects.models import Project
from projects.permissions import ObjectPermission
from users.models import User
from utils.models import build_order_by
from utils.serializers import parse_order_by


def get_posts_feed(
    qs: Post.objects = None,
    user: User = None,
    search: str = None,
    topic: Project = None,
    tags: list[Project] = None,
    categories: list[Project] = None,
    tournaments: list[Project] = None,
    forecast_type: list[str] = None,
    statuses: list[str] = None,
    order_by: str = None,
    access: PostFilterSerializer.Access = None,
    permission: str = ObjectPermission.VIEWER,
    ids: list[int] = None,
    public_figure: Project = None,
    news_type: Project = None,
    notebook_type: Notebook.NotebookType = None,
    usernames: list[str] = None,
    forecaster_id: int = None,
) -> Post.objects:
    """
    Applies filtering on the Questions QuerySet

    TODO: implement "New Comments" ordering
    """

    # If ids provided
    if ids:
        qs = qs.filter(id__in=ids)

    # Filter by permission level
    qs = qs.filter_permission(user=user, permission=permission)

    # Search
    if search:
        qs = qs.filter(
            Q(title__icontains=search) | Q(author__username__icontains=search)
        )

    # Author usernames
    if usernames:
        qs = qs.filter(author__username__in=usernames)

    # Filters
    if topic:
        qs = qs.filter(projects=topic)

    if tags:
        qs = qs.filter(projects__in=tags)

    if categories:
        qs = qs.filter(projects__in=categories)

    if notebook_type:
        qs = qs.filter(notebook__isnull=False).filter(notebook__type=notebook_type)

    if news_type:
        qs = qs.filter(projects=news_type)

    if public_figure:
        qs = qs.filter(projects=public_figure)

    # TODO: ensure projects filtering logic is correct
    #   I assume it might not work exactly as before
    if tournaments:
        qs = qs.filter(Q(projects__in=tournaments) | Q(default_project__in=tournaments))

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
            case _:
                forecast_type_q |= Q(question__type__in=forecast_type)

    qs = qs.filter(forecast_type_q)

    statuses = statuses or []

    q = Q()
    for status in statuses:
        if status in ["pending", "rejected", "deleted"]:
            q |= Q(curation_status=status)
        if status == "upcoming":
            q |= Q(
                Q(curation_status=Post.CurationStatus.APPROVED)
                & (Q(published_at__gte=timezone.now()) | Q(published_at__isnull=True))
            )
        if status == "draft":
            q |= Q(curation_status=status, author=user)
        if status == "closed":
            q |= Q(actual_close_time__isnull=False)
        if status == "resolved":
            q |= Q(resolved=True, curation_status=Post.CurationStatus.APPROVED)

        if status == "open":
            q |= Q(
                Q(published_at__lte=timezone.now())
                & Q(curation_status=Post.CurationStatus.APPROVED)
                & Q(
                    Q(actual_close_time__isnull=True)
                    | Q(actual_close_time__gte=timezone.now())
                ),
            )

    qs = qs.filter(q)

    if forecaster_id:
        qs = qs.annotate_user_last_forecasts_date(forecaster_id).filter(
            user_last_forecasts_date__isnull=False
        )

    # Filter by access
    if access == PostFilterSerializer.Access.PRIVATE:
        qs = qs.filter_private()
    if access == PostFilterSerializer.Access.PUBLIC:
        qs = qs.filter_public()

    # Performing query override
    # Before running order_by
    qs = Post.objects.filter(pk__in=qs.distinct("id"))

    # Ordering
    if order_by:
        order_desc, order_type = parse_order_by(order_by)

        if order_type == PostFilterSerializer.Order.VOTES:
            qs = qs.annotate_vote_score()
        if order_type == PostFilterSerializer.Order.COMMENT_COUNT:
            qs = qs.annotate_comment_count()
        if (
            forecaster_id
            and order_type == PostFilterSerializer.Order.USER_LAST_FORECASTS_DATE
        ):
            qs = qs.annotate_user_last_forecasts_date(forecaster_id)
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

        qs = qs.order_by(build_order_by(order_type, order_desc))
    else:
        qs = qs.order_by("-created_at")

    return qs
