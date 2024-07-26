from comments.models import Comment
from posts.models import Post, PostUserSnapshot
from posts.tasks import run_notify_new_comments
from projects.models import Project
from projects.permissions import ObjectPermission
from questions.models import Forecast
from users.models import User


def get_comment_permission_for_user(
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
        permissions = None

    return permissions


def create_comment(
    user: User,
    on_post: Post = None,
    parent: Comment = None,
    included_forecast: Forecast = None,
    is_private: bool = False,
    text: str = None,
) -> Comment:
    on_post = parent.on_post if parent else on_post

    obj = Comment.objects.create(
        author=user,
        parent=parent,
        is_soft_deleted=False,
        text=text,
        on_post=on_post,
        included_forecast=included_forecast,
        is_private=is_private,
    )

    # Save project and validate
    obj.full_clean()
    obj.save()

    # Update comments read cache counter
    PostUserSnapshot.update_viewed_at(on_post, user)

    # Send related notifications
    if on_post:
        run_notify_new_comments.send(on_post.id)

    return obj


def get_post_comments_count(post: Post):
    return post.comments.filter(is_private=False).exclude(is_soft_deleted=True).count()
