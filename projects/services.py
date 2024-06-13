from projects.models import Project
from users.models import User


def get_projects_qs(user: User = None):
    """
    Returns available projects for the user
    """

    return Project.objects.filter_active().filter_allowed(user=user)
