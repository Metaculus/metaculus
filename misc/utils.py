from rest_framework.generics import get_object_or_404

from django.db.models import Q

from posts.models import Post
from users.models import User


def get_whitelist_status(user: User, post_id: int | None, project_id: int | None):
    if not project_id and not post_id:
        # if no project or post is specified, grab universal whitelistings
        whitelistings = user.whitelists.filter(project__isnull=True, post__isnull=True)
    elif post_id:
        post = get_object_or_404(Post, pk=post_id)
        whitelistings = user.whitelists.filter(
            Q(project__isnull=True, post__isnull=True)
            | Q(project__in=post.get_related_projects())
            | Q(post_id=post_id)
        )
    else:  # project_id exists
        get_object_or_404(Post, pk=project_id)
        whitelistings = user.whitelists.filter(
            Q(project__isnull=True, post__isnull=True) | Q(project_id=project_id)
        )

    is_whitelisted = whitelistings.exists()
    view_deanonymized_data = whitelistings.filter(view_deanonymized_data=True).exists()
    return is_whitelisted, view_deanonymized_data
