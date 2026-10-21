from rest_framework.generics import get_object_or_404

from django.db.models import Q

from posts.models import Post
from projects.models import ObjectPermission, ProjectUserPermission, Project
from users.constants import API_ACCESS_LEVEL_RANK, API_ACCESS_RESTRICTED
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


def max_api_access_level(*levels: str | None) -> str:
    """The most permissive of the given levels, or `restricted` if none apply.

    Unrecognized levels rank as restricted rather than raising: this runs on the path
    that answers every gateway request, so a stale stored value must not take the
    whole API down.
    """

    # `restricted` is always a candidate, so an unranked value cannot win by being the
    # only one present. max() returns the first of equal-ranking candidates, which keeps
    # the known level rather than the stale one.
    candidates = [API_ACCESS_RESTRICTED, *(level for level in levels if level)]
    return max(candidates, key=lambda level: API_ACCESS_LEVEL_RANK.get(level, 0))


def _get_api_access_grants(user: User) -> list[tuple[int | None, str]]:
    """The user's (project_id, access_level) grants.

    Reads through `user.api_accesses.all()`, so a user whose grants were prefetched
    costs no query.
    """

    return [(grant.project_id, grant.access_level) for grant in user.api_accesses.all()]


def get_global_api_access_level(user: User | None) -> str:
    """The level a user holds on every request, from their unscoped grant if any."""

    if not user or not user.is_authenticated:
        return API_ACCESS_RESTRICTED

    return max_api_access_level(
        *(
            level
            for project_id, level in _get_api_access_grants(user)
            if project_id is None
        )
    )


def get_project_api_access_levels(user: User | None) -> list[dict]:
    """Effective levels for each project the user holds a project-scoped grant on.

    Each entry already folds in the user's global level, so it states the level that
    actually applies to that project rather than the stored grant alone.
    """

    if not user or not user.is_authenticated:
        return []

    grants = _get_api_access_grants(user)
    global_level = max_api_access_level(
        *(level for project_id, level in grants if project_id is None)
    )
    return [
        {
            "project_id": project_id,
            "api_access_tier": max_api_access_level(level, global_level),
        }
        for project_id, level in grants
        if project_id is not None
    ]
