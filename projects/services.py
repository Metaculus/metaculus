from projects.models import Project
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
