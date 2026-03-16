from rest_framework.generics import get_object_or_404

from django.db.models import Q

from posts.models import Post
from projects.models import ObjectPermission, ProjectUserPermission, Project
from users.models import User


def get_data_access_status(
    user: User | None, post_id: int | None, project_id: int | None
):
    # returns the most permissive data access status for the user
    # Note: if user is admin for given post or project,
    # they are considered to have full data access
    if not user:
        return False, False
    if user.is_superuser or user.is_staff:
        return True, True

    project = None
    user_data_accesses = user.data_accesses.filter(view_user_data=True)
    # start with universal data access entries
    data_access_entries = user_data_accesses.filter(
        project__isnull=True, post__isnull=True
    )
    if post_id:
        post = get_object_or_404(Post, pk=post_id)
        project = post.default_project
        data_access_entries |= user_data_accesses.filter(
            Q(project=project) | Q(post_id=post_id)
        )
    if project_id:
        project = get_object_or_404(Project, pk=project_id)
        data_access_entries |= user_data_accesses.filter(project_id=project_id)

    # if user is admin for the project, they have data access
    if (
        project
        and ProjectUserPermission.objects.filter(
            user=user,
            project=project,
            permission=ObjectPermission.ADMIN,
        ).exists()
    ):
        return True, True

    has_data_access = data_access_entries.exists()
    view_deanonymized_data = data_access_entries.filter(
        view_deanonymized_data=True
    ).exists()
    return has_data_access, view_deanonymized_data
