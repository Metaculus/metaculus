from django.db.models import Q
from django.utils import timezone

from posts.models import Post
from posts.serializers import PostFilterSerializer
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services import get_global_public_project, get_private_user_project
from questions.services import (
    create_question,
    create_conditional,
    create_group_of_questions,
)
from users.models import User
from utils.dtypes import flatten


def get_posts_feed(
    qs: Post.objects = None,
    user: User = None,
    search: str = None,
    topic: Project = None,
    tags: list[Project] = None,
    categories: list[Project] = None,
    tournaments: list[Project] = None,
    forecast_type: list[str] = None,
    status: str = None,
    answered_by_me: bool = None,
    order: str = None,
) -> Post.objects:
    """
    Applies filtering on the Questions QuerySet
    """

    # Search
    if search:
        qs = qs.filter(
            Q(title__icontains=search) | Q(author__username__icontains=search)
        )

    # Filters
    if topic:
        qs = qs.filter(projects=topic)

    if tags:
        qs = qs.filter(projects__in=tags)

    if categories:
        qs = qs.filter(projects__in=categories)

    # TODO: ensure projects filtering logic is correct
    #   I assume it might not work exactly as before
    if tournaments:
        qs = qs.filter(projects__in=tournaments)

    if forecast_type:
        forecast_type_q = Q()

        if "conditional" in forecast_type:
            forecast_type.pop(forecast_type.index("conditional"))
            forecast_type_q |= Q(conditional__isnull=False)

        if "group_of_questions" in forecast_type:
            forecast_type.pop(forecast_type.index("group_of_questions"))
            forecast_type_q |= Q(group_of_questions__isnull=False)

        if forecast_type:
            forecast_type_q |= Q(question__type__in=forecast_type)

        qs = qs.filter(forecast_type_q)

    if status:
        if "resolved" in status:
            qs = qs.filter(question__resolved_at__isnull=False).filter(
                question__resolved_at__lte=timezone.now()
            )
        if "active" in status:
            qs = (
                qs.filter(question__resolved_at__isnull=False)
                .filter(published_at__lte=timezone.now())
                .filter(
                    Q(
                        Q(question__closed_at__gte=timezone.now())
                        | Q(question__closed_at__isnull=True)
                    )
                )
                .filter(
                    Q(
                        Q(question__resolved_at__gte=timezone.now())
                        | Q(question__resolved_at__isnull=True)
                    )
                )
            )
        if "closed" in status:
            qs = qs.filter(question__closed_at__isnull=False).filter(
                question__closed_at__lte=timezone.now()
            )

        if "in_review" in status:
            qs = qs.filter(published_at__isnull=True).filter(
                Q(
                    Q(question__closed_at__gte=timezone.now())
                    | Q(question__closed_at__isnull=True)
                )
            )

    if answered_by_me is not None and not user.is_anonymous:
        condition = {"question__forecast__author": user}
        qs = qs.filter(**condition) if answered_by_me else qs.exclude(**condition)

    # Ordering
    if order:
        match order:
            case PostFilterSerializer.Order.MOST_FORECASTERS:
                qs = qs.annotate_predictions_count__unique().order_by("-nr_forecasters")
            case PostFilterSerializer.Order.CLOSED_AT:
                qs = qs.order_by("-closed_at")
            case PostFilterSerializer.Order.RESOLVED_AT:
                qs = qs.order_by("-resolved_at")
            case PostFilterSerializer.Order.CREATED_AT:
                qs = qs.order_by("-created_at")

    return qs


def create_post(
    *,
    title: str = None,
    projects: dict[str, list[Project]] = None,
    question: dict = None,
    conditional: dict = None,
    group_of_questions: dict = None,
    author: User = None,
    is_public: bool = True,
) -> Post:
    obj = Post(title=title, author=author)

    # Adding questions
    if question:
        obj.question = create_question(**question)
    elif conditional:
        obj.conditional = create_conditional(**conditional)
    elif group_of_questions:
        obj.group_of_questions = create_group_of_questions(**group_of_questions)

    obj.full_clean()
    obj.save()

    # Projects appending
    projects = flatten(projects.values()) if projects else []

    # If no projects were provided,
    # We need to append default ones
    if not projects:
        projects = [
            (
                get_global_public_project()
                if is_public
                else get_private_user_project(author)
            )
        ]

    # Adding projects
    obj.projects.add(*projects)

    return obj


def get_post_permission_for_user(
    post: Post, user: User = None
) -> ObjectPermission | None:
    """
    A small wrapper to get the permission of post
    """

    return (
        Post.objects.annotate_user_permission(user=user)
        .values_list("user_permission", flat=True)
        .get(id=post.id)
    )
