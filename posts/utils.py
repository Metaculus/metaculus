from django.template.defaultfilters import slugify
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from posts.models import Post
from posts.services.common import get_post_permission_for_user
from projects.permissions import ObjectPermission
from users.models import User


def _can_edit_approved_post(post: Post, permission):
    if permission == ObjectPermission.ADMIN:
        return True

    if permission == ObjectPermission.CURATOR and post.open_time > timezone.now():
        return True

    return False


def check_can_edit_post(post: Post, user: User):
    permission = get_post_permission_for_user(post, user=user)

    if post.curation_status != Post.CurationStatus.APPROVED or _can_edit_approved_post(
        post, permission
    ):
        return ObjectPermission.can_edit(permission, raise_exception=True)

    raise PermissionDenied("You do not have permission to edit an approved post")


def get_post_slug(post: Post) -> str:
    return slugify(post.short_title or post.title or "")
