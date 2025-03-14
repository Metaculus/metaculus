import difflib

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from comments.models import Comment, CommentDiff
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

    with transaction.atomic():
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

    # Handle translations
    trigger_update_comment_translations(obj)

    return obj


def update_comment(comment: Comment, text: str = None):
    differ = difflib.Differ()

    diff = list(differ.compare(comment.text.splitlines(), text.splitlines()))
    text_diff = "\n".join(diff)

    with transaction.atomic():
        comment_diff = CommentDiff.objects.create(
            comment=comment,
            author=comment.author,
            text_diff=text_diff,
        )

        comment.edit_history.append(comment_diff.id)
        comment.text = text
        comment.text_edited_at = timezone.now()
        comment.save(update_fields=["text", "edit_history", "text_edited_at"])

    trigger_update_comment_translations(comment)


def trigger_update_comment_translations(comment: Comment):
    on_post = comment.on_post
    author = comment.author
    on_bots_tournament = (
        on_post.default_project is not None
        and on_post.default_project.include_bots_in_leaderboard
    )

    on_private_post = on_post.is_private() is None
    if (
        not (author.is_bot and on_bots_tournament)
        and not on_private_post
        and comment.is_automatically_translated
    ):
        comment.update_and_maybe_translate()


def pin_comment(comment: Comment):
    if comment.root_id:
        raise ValidationError("Cannot pin child comment")

    comment.is_pinned = True
    comment.save(update_fields=["is_pinned"])

    return comment


def unpin_comment(comment: Comment):
    comment.is_pinned = False
    comment.save(update_fields=["is_pinned"])

    return comment
