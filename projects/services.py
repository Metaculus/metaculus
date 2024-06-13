from projects.models import Project
from projects.permissions import ObjectPermission
from users.models import User


def get_projects_qs(user: User = None):
    """
    Returns available projects for the user
    """

    return Project.objects.filter_active().filter_allowed(user=user)


def get_global_public_project():
    """
    Getting a Global project which is automatically assigned to all public posts
    """

    obj, _ = Project.objects.get_or_create(
        id=0,
        defaults={
            "name": "Global Project",
            "type": Project.ProjectTypes.CATEGORY,
            "default_permission": ObjectPermission.FORECASTER,
        },
    )

    return obj


def get_private_user_project(user: User):
    """
    All private user projects are created under the "Personal List" project type
    """

    if not user:
        raise ValueError("User is required")

    obj, _ = Project.objects.get_or_create(
        type=Project.ProjectTypes.PERSONAL_LIST,
        created_by=user,
        defaults={
            "name": f"{user.username}'s Personal List",
            "type": Project.ProjectTypes.PERSONAL_LIST,
            # Only question owner has permissions to modify it
            "default_permission": None,
        },
    )

    return obj
