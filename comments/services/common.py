from comments.models import Comment
from posts.models import Post, PostUserSnapshot
from projects.models import Project
from projects.permissions import ObjectPermission
from questions.models import Forecast
from users.models import User

from ..tasks import run_on_post_comment_create


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

    obj = Comment(
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

    # Send related notifications and update counters
    # Only if comment is public
    if on_post and not obj.is_private:
        on_post.update_comment_count()
        run_on_post_comment_create.send(obj.id)

    return obj


def trigger_update_comment_translations(comment: Comment, force: bool = False):
    if force:
        comment.trigger_translation_if_dirty()
        return

    on_post = comment.on_post
    author = comment.author
    on_bots_tournament = (
        on_post.default_project is not None
        and on_post.default_project.include_bots_in_leaderboard
    )

    on_private_post = on_post.is_private() is None
    if not (author.is_bot and on_bots_tournament) and not on_private_post:
        comment.trigger_translation_if_dirty()
