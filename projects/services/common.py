from collections import defaultdict
from datetime import datetime, timedelta
from itertools import chain
from typing import Iterable

from django.db import IntegrityError
from django.db.models import QuerySet, TextChoices
from django.utils import timezone
from django.utils.timezone import make_aware

from posts.models import Post
from projects.models import Project, ProjectUserPermission
from projects.permissions import ObjectPermission
from questions.models import Question
from users.models import User
from utils.cache import cache_per_object
from utils.dtypes import generate_map_from_list


# TODO: add caching override!


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


def get_questions_by_project(
    project_ids: Iterable[int],
    question_qs: QuerySet[Question] | None = None,
    post_qs: QuerySet[Post] | None = None,
) -> dict[int, list[Question]]:
    """
    Returns {project_id: [questions]} for the given project IDs.
    Collects questions via both default_project FK and M2M posts relationship.
    """

    if post_qs is None:
        post_qs = Post.objects.filter(curation_status=Post.CurationStatus.APPROVED)
    if question_qs is None:
        question_qs = Question.objects.all()

    project_ids = list(project_ids)

    # Map project -> post IDs via both relationships
    project_posts = defaultdict(set)

    for post_id, proj_id in post_qs.filter(
        default_project_id__in=project_ids
    ).values_list("id", "default_project_id"):
        project_posts[proj_id].add(post_id)

    for post_id, proj_id in Post.projects.through.objects.filter(
        project_id__in=project_ids,
        post__in=post_qs,
    ).values_list("post_id", "project_id"):
        project_posts[proj_id].add(post_id)

    # Bulk fetch questions
    questions_by_post = defaultdict(list)
    all_post_ids = set().union(*project_posts.values()) if project_posts else set()
    for q in question_qs.filter(post_id__in=all_post_ids):
        questions_by_post[q.post_id].append(q)

    return {
        pid: list(
            chain.from_iterable(
                questions_by_post[post_id] for post_id in project_posts.get(pid, [])
            )
        )
        for pid in project_ids
    }


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
        post_id__in=list(
            Post.objects.filter_projects(project)
            .filter(curation_status=Post.CurationStatus.APPROVED)
            .values_list("id", flat=True)
        )
    )

    return _calculate_timeline_data(project, questions)


@cache_per_object(timeout=60 * 15)
def get_timeline_data_for_projects(project_ids: list[int]) -> dict[int, dict]:
    projects = Project.objects.in_bulk(project_ids)

    question_qs = Question.objects.only(
        "id",
        "post_id",
        "cp_reveal_time",
        "actual_resolve_time",
        "scheduled_resolve_time",
        "actual_close_time",
        "scheduled_close_time",
    )
    questions_by_project = get_questions_by_project(
        project_ids, question_qs=question_qs
    )

    return {
        pid: _calculate_timeline_data(project, questions_by_project.get(pid, []))
        for pid, project in projects.items()
    }


class FeedTileRule(TextChoices):
    # Declaration order defines priority (first = highest)
    NEW_TOURNAMENT = "NEW_TOURNAMENT"
    NEW_QUESTIONS = "NEW_QUESTIONS"
    RESOLVED_QUESTIONS = "RESOLVED_QUESTIONS"
    ALL_QUESTIONS_RESOLVED = "ALL_QUESTIONS_RESOLVED"


def get_feed_project_tiles() -> list[dict]:
    now = timezone.now()

    projects = list(
        Project.objects.filter_tournament()
        .exclude(visibility=Project.Visibility.UNLISTED)
        .filter(default_permission__isnull=False)
        .select_related("primary_leaderboard")
    )

    question_qs = Question.objects.only(
        "id", "post_id", "open_time", "actual_resolve_time", "resolution",
        "resolution_set_time",
    )
    questions_by_project = get_questions_by_project(
        [p.id for p in projects], question_qs=question_qs
    )

    three_days_ago = now - timedelta(days=3)
    results = []

    for project in projects:
        questions = questions_by_project.get(project.id, [])
        recently_opened = sum(
            1 for q in questions if q.open_time and three_days_ago <= q.open_time <= now
        )
        recently_resolved = sum(
            1
            for q in questions
            if q.resolution_set_time and q.resolution_set_time >= three_days_ago
        )
        all_resolved = len(questions) > 0 and all(q.resolution for q in questions)
        last_resolve_time = max(
            (q.resolution_set_time for q in questions if q.resolution_set_time),
            default=None,
        )

        rule: FeedTileRule | None = None

        if project.start_date and abs((project.start_date - now).days) <= 10:
            rule = FeedTileRule.NEW_TOURNAMENT
        elif recently_opened >= 3:
            rule = FeedTileRule.NEW_QUESTIONS
        elif recently_resolved >= 3:
            rule = FeedTileRule.RESOLVED_QUESTIONS
        elif (
            all_resolved
            and last_resolve_time
            # TODO: should we use project.close_date or forecasting_end_date?
            and max(last_resolve_time, project.close_date or last_resolve_time)
            >= now - timedelta(days=10)
        ):
            rule = FeedTileRule.ALL_QUESTIONS_RESOLVED

        if rule:
            results.append(
                {
                    "project": project,
                    "recently_opened_questions": recently_opened,
                    "recently_resolved_questions": recently_resolved,
                    "all_questions_resolved": all_resolved,
                    "rule": rule,
                }
            )

    rule_priority = list(FeedTileRule)
    results.sort(
        key=lambda r: (rule_priority.index(r["rule"]), r["project"].order or 0)
    )

    # Fallback: if no rules matched, return the highest-ordered project
    if not results:
        # TODO: adjust fallback sorting!
        best = min(projects, key=lambda p: p.order or 0)
        results = [
            {
                "project": best,
                "recently_opened_questions": 0,
                "recently_resolved_questions": 0,
                "all_questions_resolved": False,
                "rule": None,
            }
        ]

    return results


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
