from collections import defaultdict
from datetime import datetime
from itertools import chain
from typing import Iterable

from django.db import IntegrityError
from django.db.models import F
from django.utils import timezone
from django.utils.timezone import make_aware

from posts.models import Post
from projects.models import Project, ProjectUserPermission
from projects.permissions import ObjectPermission
from questions.models import Question
from users.models import User
from utils.cache import cache_per_object
from utils.dtypes import generate_map_from_list


def get_projects_qs(
    user: User = None,
    permission: ObjectPermission = None,
    show_on_homepage: bool = None,
    show_on_services_page: bool = None,
):
    """
    Returns available projects for the user
    """

    qs = Project.objects.filter_permission(user=user, permission=permission)

    if show_on_homepage:
        qs = qs.filter(show_on_homepage=True)

    if show_on_services_page:
        qs = qs.filter(show_on_services_page=True)

    return qs


def get_site_main_project():
    obj, _ = Project.objects.get_or_create(
        type=Project.ProjectTypes.SITE_MAIN,
        defaults={"visibility": Project.Visibility.NORMAL},
    )

    return obj


def get_project_permission_for_user(
    project: Project, user: User = None
) -> ObjectPermission:
    """
    A small wrapper to get the permission of project
    """

    return (
        Project.objects.annotate_user_permission(user=user)
        .values_list("user_permission", flat=True)
        .get(id=project.id)
    )


def invite_user_to_project(
    project: Project,
    user: User,
    permission: ObjectPermission = ObjectPermission.FORECASTER,
):
    """
    Invites user to the private project
    """

    try:
        ProjectUserPermission.objects.create(
            user=user, project=project, permission=permission
        )
    except IntegrityError:
        # User was already invited
        return


def get_projects_staff_users(
    project_ids: Iterable[int],
) -> dict[int, dict[int, ObjectPermission]]:
    """
    Generates map of users which are admins/mods for the given projects
    """

    m2m_objects = ProjectUserPermission.objects.filter(
        project_id__in=project_ids,
        permission__in=[ObjectPermission.ADMIN, ObjectPermission.CURATOR],
    )
    project_staff_map = generate_map_from_list(m2m_objects, lambda x: x.project_id)

    # Extracting superusers
    # Should be visible as admins in every project
    superusers = User.objects.filter(is_superuser=True).only("id")

    return {
        project_id: {
            **{
                obj.user_id: obj.permission
                for obj in project_staff_map.get(project_id, [])
            },
            **{obj.id: ObjectPermission.ADMIN for obj in superusers},
        }
        for project_id in project_ids
    }


def get_projects_for_posts(
    posts: Iterable[Post], user: User = None
) -> dict[int, list[Project]]:
    """
    Retrieves a mapping of posts to their available projects for a given user.
    """

    post_projects = Post.projects.through.objects.filter(post__in=posts)

    # Fetching projects available for the given user
    available_projects_map = {
        obj.id: obj
        for obj in Project.objects.filter(id__in=[x.project_id for x in post_projects])
        .filter_permission(user=user)
        .select_related("primary_leaderboard")
    }

    post_projects_map = defaultdict(list)

    # Generating Post->Projects map
    for m2m_obj in post_projects:
        if project := available_projects_map.get(m2m_obj.project_id):
            post_projects_map[m2m_obj.post_id].append(project)

    return post_projects_map


def move_project_forecasting_end_date(project: Project, post: Post):
    if not project.close_date:
        return

    forecasting_end_date = project.forecasting_end_date

    for question in post.get_questions():
        if (
            question.scheduled_close_time <= project.close_date
            and question.scheduled_resolve_time <= project.close_date
            and (
                not forecasting_end_date
                or question.scheduled_close_time > forecasting_end_date
            )
        ):
            forecasting_end_date = question.scheduled_close_time

    project.forecasting_end_date = forecasting_end_date
    project.save(update_fields=["forecasting_end_date"])


def _calculate_timeline_data(project: Project, questions: Iterable[Question]) -> dict:
    all_questions_resolved = True
    all_questions_closed = True

    cp_reveal_times = []
    actual_resolve_times = []
    scheduled_resolve_times = []

    project_close_date = project.close_date or make_aware(datetime.max)
    project_forecasting_end_date = project.forecasting_end_date or project_close_date

    for question in questions:
        if all_questions_resolved:
            all_questions_resolved = (
                question.actual_resolve_time
                # Or treat as resolved as scheduled resolution is in the future
                or question.scheduled_resolve_time > project_close_date
            )

        # Determine questions closure
        if all_questions_closed:
            close_time = question.actual_close_time or question.scheduled_close_time
            all_questions_closed = (
                close_time <= timezone.now()
                or close_time > project_forecasting_end_date
            )

        if question.cp_reveal_time:
            cp_reveal_times.append(question.cp_reveal_time)

        if question.actual_resolve_time:
            actual_resolve_times.append(question.actual_resolve_time)

        if question.scheduled_resolve_time:
            scheduled_resolve_time = (
                question.actual_resolve_time or question.scheduled_resolve_time
            )
            scheduled_resolve_times.append(scheduled_resolve_time)

    def get_max(data: list):
        return max([x for x in data if x <= project_close_date], default=None)

    return {
        "last_cp_reveal_time": get_max(cp_reveal_times),
        "latest_actual_resolve_time": get_max(actual_resolve_times),
        "latest_scheduled_resolve_time": get_max(scheduled_resolve_times),
        "all_questions_resolved": all_questions_resolved,
        "all_questions_closed": all_questions_closed,
    }


def get_project_timeline_data(project: Project):
    questions = Question.objects.filter(
        related_posts__post_id__in=list(
            Post.objects.filter_projects(project)
            .filter(curation_status=Post.CurationStatus.APPROVED)
            .values_list("id", flat=True)
        )
    )

    return _calculate_timeline_data(project, questions)


@cache_per_object(timeout=60 * 15)
def get_timeline_data_for_projects(project_ids: list[int]) -> dict[int, dict]:
    projects = Project.objects.in_bulk(project_ids)

    # 1. Map Project -> Post IDs
    project_posts = defaultdict(set)

    # Default projects
    qs_default = Post.objects.filter(
        default_project_id__in=project_ids,
        curation_status=Post.CurationStatus.APPROVED,
    ).values_list("id", "default_project_id")

    # M2M projects
    qs_m2m = Post.projects.through.objects.filter(
        project_id__in=project_ids,
        post__curation_status=Post.CurationStatus.APPROVED,
    ).values_list("post_id", "project_id")

    for post_id, project_id in chain(qs_default, qs_m2m):
        project_posts[project_id].add(post_id)

    # 2. Fetch Questions
    all_post_ids = set().union(*project_posts.values())

    questions = (
        Question.objects.filter(related_posts__post_id__in=all_post_ids)
        .annotate(post_id=F("related_posts__post_id"))
        .only(
            "id",
            "cp_reveal_time",
            "actual_resolve_time",
            "scheduled_resolve_time",
            "actual_close_time",
            "scheduled_close_time",
        )
    )

    # Group by post
    questions_by_post = defaultdict(list)
    for q in questions:
        questions_by_post[q.post_id].append(q)

    # 3. Aggregate
    return {
        pid: _calculate_timeline_data(
            project,
            chain.from_iterable(
                questions_by_post[post_id] for post_id in project_posts.get(pid, [])
            ),
        )
        for pid, project in projects.items()
    }


def get_questions_count_for_projects(project_ids: list[int]) -> dict[int, int]:
    """
    Returns a dict mapping each project_id to its questions_count
    (0 if it doesn’t exist or has no questions).
    """
    qs = (
        Project.objects.filter(id__in=project_ids)
        .annotate_questions_count()
        .values_list("id", "questions_count")
    )
    return {pid: count or 0 for pid, count in qs}
