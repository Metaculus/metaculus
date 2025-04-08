from collections import defaultdict
from datetime import datetime
from typing import Iterable

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.timezone import make_aware

from notifications.constants import MailingTags
from notifications.services import (
    NotificationPostStatusChange,
    NotificationPostParams,
    NotificationProjectParams,
)
from posts.models import Post
from projects.models import Project, ProjectUserPermission, ProjectSubscription
from projects.permissions import ObjectPermission
from questions.models import Question
from users.models import User
from utils.dtypes import generate_map_from_list


def get_projects_qs(
    user: User = None,
    permission: ObjectPermission = None,
    show_on_homepage: bool = None,
):
    """
    Returns available projects for the user
    """

    qs = Project.objects.filter_permission(user=user, permission=permission)

    if show_on_homepage:
        qs = qs.filter(show_on_homepage=True)

    return qs


def get_site_main_project():
    obj, _ = Project.objects.get_or_create(
        type=Project.ProjectTypes.SITE_MAIN,
        defaults={"visibility": Project.Visibility.NORMAL},
    )

    return obj


def create_private_user_project(user: User):
    """
    All private user projects are created under the "Personal List" project type
    """

    if not user:
        raise ValueError("User is required")

    obj, _ = Project.objects.create(
        type=Project.ProjectTypes.PERSONAL_PROJECT,
        created_by=user,
        name=f"{user.username}'s Personal List",
        default_permission=None,
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


@transaction.atomic
def subscribe_project(project: Project, user: User):
    obj = ProjectSubscription(
        project=project,
        user=user,
    )

    try:
        obj.save()
    except IntegrityError:
        # Skip if use has been already subscribed
        return

    project.update_followers_count()
    project.save()


@transaction.atomic
def unsubscribe_project(project: Project, user: User) -> ProjectSubscription:
    ProjectSubscription.objects.filter(project=project, user=user).delete()

    project.update_followers_count()
    project.save()


def notify_project_subscriptions_post_open(post: Post):
    subscriptions = (
        ProjectSubscription.objects.filter(
            Q(project__posts=post) | Q(project__default_posts=post)
        )
        .filter(
            # Ensure notify users that have access to the question
            user__in=post.default_project.get_users_for_permission(
                ObjectPermission.VIEWER
            )
        )
        .prefetch_related("project", "user")
        .distinct("user")
    )

    # Ensure post is available for users
    for subscription in subscriptions:
        NotificationPostStatusChange.schedule(
            subscription.user,
            NotificationPostStatusChange.ParamsType(
                post=NotificationPostParams.from_post(post),
                event=Post.PostStatusChange.OPEN,
                project=NotificationProjectParams.from_project(subscription.project),
            ),
            mailing_tag=MailingTags.TOURNAMENT_NEW_QUESTIONS,
        )


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
        for obj in Project.objects.filter(
            id__in=[x.project_id for x in post_projects]
        ).filter_permission(user=user)
    }

    post_projects_map = defaultdict(list)

    # Generating Post->Projects map
    for m2m_obj in post_projects:
        if project := available_projects_map.get(m2m_obj.project_id):
            post_projects_map[m2m_obj.post_id].append(project)

    return post_projects_map


def get_project_timeline_data(project: Project):
    all_questions_resolved = True
    all_questions_closed = True

    cp_reveal_times = []
    actual_resolve_times = []
    scheduled_resolve_times_map: list[tuple[datetime, Question]] = []
    actual_close_times = []

    posts = (
        Post.objects.filter_projects(project)
        .filter_questions()
        .prefetch_questions()
        .filter(curation_status=Post.CurationStatus.APPROVED)
    )

    project_close_date = project.close_date or make_aware(datetime.max)

    for post in posts:
        for question in post.get_questions():
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
                    close_time <= timezone.now() or close_time > project_close_date
                )

            if question.cp_reveal_time:
                cp_reveal_times.append(question.cp_reveal_time)

            if question.actual_resolve_time:
                actual_resolve_times.append(question.actual_resolve_time)

            if question.scheduled_resolve_time:
                scheduled_resolve_time = (
                    question.actual_resolve_time or question.scheduled_resolve_time
                )
                scheduled_resolve_times_map.append((scheduled_resolve_time, question))

            if question.actual_close_time:
                actual_close_times.append(question.actual_close_time)

    def get_max(data: list):
        return max([x for x in data if x <= project_close_date], default=None)

    # The last close date from questions that are set to resolve before the close date
    timeline_closure = (
        max(
            [
                q.scheduled_close_time
                for r, q in scheduled_resolve_times_map
                if r <= project_close_date
            ],
            default=None,
        )
        or project.forecasting_end_date
        or project_close_date
    )

    if project.forecasting_end_date:
        # 1) the set new tournament forecasting end date OR 2) the last close date from questions
        # that are set to RESOLVE before the close date, whichever is LATEST
        timeline_closure = max([project.forecasting_end_date, timeline_closure])

    return {
        "last_cp_reveal_time": get_max(cp_reveal_times),
        "latest_actual_resolve_time": get_max(actual_resolve_times),
        "latest_scheduled_resolve_time": get_max(
            [x[0] for x in scheduled_resolve_times_map]
        ),
        "latest_actual_close_time": get_max(actual_close_times),
        "all_questions_resolved": all_questions_resolved,
        "all_questions_closed": all_questions_closed,
        "timeline_closure": timeline_closure
    }
