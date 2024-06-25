from comments.models import Comment
from posts.models import Post
from projects.models import Project
from projects.permissions import ObjectPermission
from users.models import User


def get_comment_permission_for_comment(
    comment: Comment, user: User = None
) -> ObjectPermission:
    """
    A small wrapper to get the permission of post
    """

    permissions = None
    if comment.on_post:
        permissions = (
            Post.objects.filter(pk=comment.on_post.pk)
            .annotate_user_permission(user=user)[0]
            .user_permission
        )
    if comment.on_project:
        permissions = (
            Project.objects.filter(pk=comment.on_project.pk)
            .annotate_user_permission(user=user)[0]
            .user_permission
        )
    if (
        permissions == ObjectPermission.CREATOR
        or permissions == ObjectPermission.FORECASTER
    ):
        permissions = ObjectPermission.VIEWER

    if user.id == comment.author.id:
        permissions = ObjectPermission.CREATOR
    if comment.is_private and permissions != ObjectPermission.CREATOR:
        permissions = ObjectPermission.NONE

    return permissions
