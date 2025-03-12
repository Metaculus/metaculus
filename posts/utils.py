from django.template.defaultfilters import slugify
from rest_framework.exceptions import PermissionDenied

from posts.models import Post
from posts.services.common import get_post_permission_for_user
from projects.permissions import ObjectPermission
from users.models import User


def check_can_edit_post(post: Post, user: User):
    permission = get_post_permission_for_user(post, user=user)

    if (
        permission == ObjectPermission.CREATOR
        and post.curation_status == Post.CurationStatus.APPROVED
    ):
        raise PermissionDenied("You do not have permission to edit active post")

    ObjectPermission.can_edit(permission, raise_exception=True)


def get_post_slug(post: Post) -> str:
    return slugify(post.short_title or post.title or "")
