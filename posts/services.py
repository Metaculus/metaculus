from typing import Optional
from django.db.models import Q
from django.utils import timezone

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
    answered_by_me: bool = None,
    order: str = None,
    access: PostFilterSerializer.Access = None,
    permission: str = ObjectPermission.VIEWER,
    ids: list[int] = None,
    public_figure: Project = None,
    news_type: Project = None,
    notebook_type: Notebook.NotebookType = None,
) -> Post.objects:
    """
    Applies filtering on the Questions QuerySet
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

    if forecast_type:
        forecast_type_q = Q()

        if "notebook" in forecast_type:
            forecast_type.pop(forecast_type.index("notebook"))
            forecast_type_q |= Q(notebook__isnull=False)

        if "conditional" in forecast_type:
            forecast_type.pop(forecast_type.index("conditional"))
            forecast_type_q |= Q(conditional__isnull=False)

        if "group_of_questions" in forecast_type:
            forecast_type.pop(forecast_type.index("group_of_questions"))
            forecast_type_q |= Q(group_of_questions__isnull=False)

        if forecast_type:
            forecast_type_q |= Q(question__type__in=forecast_type)
        qs = qs.filter(forecast_type_q)

    statuses = statuses or []

    q = Q()
    for status in statuses:
        if status in ["draft", "pending", "rejected", "deleted"]:
            q |= Q(curation_status=status)
        if status == "closed":
            q |= Q(closed_at__isnull=False)
        if status == "resolved":
            q |= Q(resolved_at__isnull=False, resolved_at__lte=timezone.now())

        if "active" in status:
            q |= Q(curation_status=Post.CurationStatus.APPROVED) & (
                (Q(resolved_at__isnull=True) | Q(resolved_at__gt=timezone.now()))
                & (Q(closed_at__isnull=True) | Q(closed_at__gt=timezone.now()))
            )

    qs = qs.filter(q)

    if answered_by_me is not None and not user.is_anonymous:
        condition = {"question__forecast__author": user}
        qs = qs.filter(**condition) if answered_by_me else qs.exclude(**condition)

    # Filter by access
    if access == PostFilterSerializer.Access.PRIVATE:
        qs = qs.filter_private()
    if access == PostFilterSerializer.Access.PUBLIC:
        qs = qs.filter_public()

    # Ordering
    if order:
        match order:
            case PostFilterSerializer.Order.MOST_FORECASTERS:
                qs = qs.annotate_nr_forecasters().order_by("-nr_forecasters")
            case PostFilterSerializer.Order.CLOSED_AT:
                qs = qs.order_by("-closed_at")
            case PostFilterSerializer.Order.RESOLVED_AT:
                qs = qs.order_by("-resolved_at")
            case PostFilterSerializer.Order.CREATED_AT:
                qs = qs.order_by("-created_at")
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
    author: User = None,
) -> Post:
    obj = Post(title=title, author=author, curation_status=Post.CurationStatus.DRAFT)

    # Adding questions
    if question:
        obj.question = create_question(**question)
        obj.resolved_at = obj.question.resolved_at
        obj.closed_at = obj.question.closed_at
    elif conditional:
        obj.conditional = create_conditional(**conditional)
        obj.resolved_at = obj.conditional.condition.resolved_at
        obj.closed_at = obj.conditional.condition.closed_at
    elif group_of_questions:
        obj.group_of_questions = create_group_of_questions(**group_of_questions)
        obj.resolved_at = max(
            [x["resolved_at"] for x in group_of_questions["questions"]]
        )
        obj.closed_at = max([x["closed_at"] for x in group_of_questions["questions"]])

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

    obj.default_project = main_projects[0]

    # Save project and validate
    obj.full_clean()
    obj.save()

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
