from rest_framework.generics import get_object_or_404

from django.db.models import Q

from posts.models import Post
from projects.models import ObjectPermission, ProjectUserPermission, Project
from users.models import User


def get_whitelist_status(
    user: User | None, post_id: int | None, project_id: int | None
):
    # returns the most permissive whitelist status for the user
    # Note: if user is admin for given post or project,
    # they are considered fully whitelisted
    if not user:
        return False, False
    if user.is_superuser or user.is_staff:
        # staff users are always whitelisted
        return True, True

    project = None
    user_whitelists = user.whitelists.filter(view_forecaster_data=True)
    # start with universal whitelistings
    whitelistings = user_whitelists.filter(project__isnull=True, post__isnull=True)
    if post_id:
        post = get_object_or_404(Post, pk=post_id)
        project = post.default_project
        whitelistings |= user_whitelists.filter(Q(project=project) | Q(post_id=post_id))
    if project_id:
        project = get_object_or_404(Project, pk=project_id)
        whitelistings |= user_whitelists.filter(project_id=project_id)

    # if user is admin for the project, they have whitelist status
    if (
        project
        and ProjectUserPermission.objects.filter(
            user=user,
            project=project,
            permission=ObjectPermission.ADMIN,
        ).exists()
    ):
        return True, True

    is_whitelisted = whitelistings.exists()
    view_deanonymized_data = whitelistings.filter(view_deanonymized_data=True).exists()
    return is_whitelisted, view_deanonymized_data
