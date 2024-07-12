from datetime import timedelta
from typing import Optional

from django.db.models import Q, Count, Sum, Value, Case, When, F
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from sql_util.aggregates import SubqueryAggregate

from posts.models import Notebook, Post
from posts.serializers import PostFilterSerializer
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services import get_site_main_project
from questions.services import (
    create_question,
    create_conditional,
    create_group_of_questions,
)
from users.models import User
from utils.dtypes import flatten
from utils.models import build_order_by
from utils.serializers import parse_order_by
from utils.the_math.community_prediction import get_cp_at_time
from utils.the_math.measures import (
    prediction_difference_for_display,
    prediction_difference_for_sorting,
)


def add_categories(categories: list[int], post: Post):
    existing = [x.pk for x in post.projects.filter(type=Project.ProjectTypes.CATEGORY)]
    categories = [x for x in categories if x not in existing]
    all_category_ids = [
        x.id for x in Project.objects.filter(type=Project.ProjectTypes.CATEGORY).all()
    ]
    for category_id in categories:
        if category_id not in all_category_ids:
            raise ValidationError(f"Category with id {category_id} does not exist")
        post.projects.add(Project.objects.get(pk=category_id))
    post.save()


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

    TODO: implement "upcoming" filtering
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
            q |= Q()
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


def create_post(
    *,
    title: str = None,
    projects: dict[str, list[Project]] = None,
    question: dict = None,
    conditional: dict = None,
    group_of_questions: dict = None,
    notebook: dict = None,
    author: User = None,
) -> Post:
    obj = Post(title=title, author=author, curation_status=Post.CurationStatus.DRAFT)

    # Adding questions
    if question:
        obj.question = create_question(**question)
    elif conditional:
        obj.conditional = create_conditional(**conditional)
    elif group_of_questions:
        obj.group_of_questions = create_group_of_questions(**group_of_questions)
    elif notebook:
        obj.notebook = Notebook.objects.create(**notebook)

    # Projects appending
    # Tags, categories and topics
    meta_projects = []
    # Tournaments, Question Series etc.
    main_projects = []

    for project in flatten(projects.values()) if projects else []:
        if Project.ProjectTypes.can_have_permissions(project.type):
            main_projects.append(project)
        else:
            meta_projects.append(project)

    # If no projects were provided,
    # We need to append default ones
    if not main_projects:
        main_projects = [get_site_main_project()]

    obj.default_project = main_projects.pop(0)

    # Save project and validate
    obj.full_clean()
    obj.save()

    # Sync status fields
    obj.update_pseudo_materialized_fields()

    # Adding projects
    obj.projects.add(*(meta_projects + main_projects))

    return obj


def get_post_permission_for_user(post: Post, user: User = None) -> ObjectPermission:
    """
    A small wrapper to get the permission of post
    """

    perm = (
        Post.objects.annotate_user_permission(user=user)
        .values_list("user_permission", flat=True)
        .get(id=post.id)
    )
    return perm


def compute_movement(post: Post) -> float | None:
    questions = post.get_questions()
    movement = None
    for question in questions:
        cp_now = get_cp_at_time(question, timezone.now())
        cp_previous = get_cp_at_time(
            question, timezone.now() - timezone.timedelta(days=7)
        )
        if cp_now is None or cp_previous is None:
            continue
        difference = prediction_difference_for_sorting(cp_now, cp_previous, question)
        if (movement is None) or (abs(difference) > abs(movement)):
            movement = difference
    return movement


# Computes the jeffry divergence
def compute_sorting_divergence(post: Post) -> dict[int, float]:
    user_divergences = dict()
    questions = post.get_questions()
    now = timezone.now()
    for question in questions:
        cp = get_cp_at_time(question, now)
        if cp is None:
            continue

        active_forecasts = question.forecast_set.filter(
            Q(end_time__isnull=True) | Q(end_time__gt=now),
            start_time__lte=now,
        )
        for forecast in active_forecasts:
            difference = prediction_difference_for_sorting(
                forecast.get_prediction_values(), cp, question
            )
            if (forecast.author_id not in user_divergences) or (
                abs(user_divergences[forecast.author_id]) < abs(difference)
            ):
                user_divergences[forecast.author_id] = difference

    return user_divergences


def compute_hotness():
    qs = Post.objects.filter_active()
    last_week_dt = timezone.now() - timedelta(days=7)

    qs = qs.annotate(
        # nb predictions in last week
        hotness_value=Coalesce(
            SubqueryAggregate(
                "forecasts",
                filter=Q(start_time__gte=last_week_dt),
                aggregate=Count,
            ),
            0,
        )
        + (
            # Net votes in last week * 5
            # Please note: we dind't have this before
            Coalesce(
                SubqueryAggregate(
                    "votes__direction",
                    filter=Q(created_at__gte=last_week_dt),
                    aggregate=Sum,
                ),
                0,
            )
            * 5
        )
        + (
            # nb comments in last week * 10
            Coalesce(
                SubqueryAggregate(
                    "comments__id",
                    filter=Q(created_at__gte=last_week_dt),
                    aggregate=Count,
                ),
                0,
            )
            * 10
        )
        + (
            Coalesce(
                SubqueryAggregate(
                    "activity_boosts",
                    filter=Q(created_at__gte=last_week_dt),
                    aggregate=Sum,
                ),
                0,
            )
            * 20
        )
        + Case(
            # approved in last week
            When(
                published_at__gte=last_week_dt,
                then=Value(50),
            ),
            default=Value(0),
        )
    )

    qs.update(hotness=F("hotness_value"))
