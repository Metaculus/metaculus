from django.db import IntegrityError
from django.db.models import Q

from projects.models import Project, ProjectUserPermission
from projects.permissions import ObjectPermission
from users.models import User


def get_projects_qs(user: User = None):
    """
    Returns available projects for the user
    """

    return Project.objects.filter_active().filter_permission(user=user)


def get_site_main_project():
    obj, _ = Project.objects.get_or_create(
        type=Project.ProjectTypes.SITE_MAIN,
        defaults={
            "name": "Metaculus Community",
            "type": Project.ProjectTypes.SITE_MAIN,
            "default_permission": ObjectPermission.FORECASTER,
        },
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
) -> ObjectPermission | None:
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


def invite_users_to_project(
    project: Project,
    user_identifiers: list[str],
    permission: ObjectPermission = ObjectPermission.FORECASTER,
):
    """
    Invites users to the project
    """

    queries = Q()
    for identifier in user_identifiers:
        queries |= Q(username__iexact=identifier) | Q(email__iexact=identifier)

    # Fetch the users based on the combined query
    users = User.objects.filter(queries).distinct()

    print()

    for user in users:
        invite_user_to_project(project, user, permission=permission)
