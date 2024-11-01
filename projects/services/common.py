from django.db import IntegrityError
from django.db.models import Q

from notifications.constants import MailingTags
from notifications.services import (
    NotificationPostStatusChange,
    NotificationPostParams,
    NotificationProjectParams,
)
from posts.models import Post
from projects.models import Project, ProjectUserPermission, ProjectSubscription
from projects.permissions import ObjectPermission
from users.models import User


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


def update_with_add_posts_to_main_feed(project: Project, add_posts_to_main_feed: bool):
    site_main = get_site_main_project()

    if project == site_main:
        raise ValueError("Site main can not be updated")

    post_projects = Post.objects.filter(default_project=project).all()
    project.add_posts_to_main_feed = add_posts_to_main_feed

    for post in post_projects:
        if project.add_posts_to_main_feed:
            post.projects.add(site_main)
        else:
            post.projects.remove(site_main)

    project.save()


def get_site_main_project():
    obj, _ = Project.objects.get_or_create(type=Project.ProjectTypes.SITE_MAIN)

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


def subscribe_project(project: Project, user: User) -> ProjectSubscription:
    obj = ProjectSubscription(
        project=project,
        user=user,
    )
    obj.save()

    project.update_followers_count()
    project.save()

    return obj


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
        NotificationPostStatusChange.send(
            subscription.user,
            NotificationPostStatusChange.ParamsType(
                post=NotificationPostParams.from_post(post),
                event=Post.PostStatusChange.OPEN,
                project=NotificationProjectParams.from_project(subscription.project),
            ),
            mailing_tag=MailingTags.TOURNAMENT_NEW_QUESTIONS,
        )
