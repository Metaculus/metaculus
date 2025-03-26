from datetime import timedelta
import difflib
import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from comments.models import Comment, CommentDiff
from posts.models import Post, PostUserSnapshot
from projects.models import Project
from projects.permissions import ObjectPermission
from questions.models import Forecast
from users.models import User, UserSpamActivity
from users.services.spam_detection import (
    CONFIDENCE_THRESHOLD,
    send_repeated_spam_to_admins_email,
    should_check_for_user_spam,
    send_suspected_spam_to_admins_email,
    send_deactivation_email,
)
from utils.frontend import build_frontend_url
from utils.openai import run_spam_analysis
from ..tasks import run_on_post_comment_create


spam_error = ValidationError(
    detail="This comment seems to be spam. Please contact "
    "support@metaculus.com if you believe this was a mistake.",
    code="SPAM_DETECTED",
)


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


def check_and_handle_comment_spam(author: User, comment: Comment) -> bool:

    private_note = comment.is_private
    private_post = comment.on_post.is_private() if comment.on_post else None
    if (
        not settings.CHECK_FOR_SPAM_IN_COMMENTS_AND_POSTS
        or not should_check_for_user_spam(author)
        or private_note
        or private_post
    ):
        return False

    recipients = comment.on_post.default_project.get_users_for_permission(
        ObjectPermission.CURATOR
    )

    result = run_spam_analysis(comment.text, UserSpamActivity.SpamContentType.COMMENT)

    # TODO: Remove this once we gain some confidence it the level of false positives is acceptable
    logging.debug("Spam analysis result", result)

    if not result.is_spam:
        return False

    UserSpamActivity.objects.create(
        user=author,
        reason=result.reason,
        confidence=result.confidence,
        content_type=UserSpamActivity.SpamContentType.COMMENT,
        content_id=comment.id,
        text=comment.text,
    )

    # High confidence spam
    if result.confidence > CONFIDENCE_THRESHOLD:
        # Deactivate user if they have 10 or more spam entries
        total_spam_count = UserSpamActivity.objects.filter(
            user=author, confidence__gte=CONFIDENCE_THRESHOLD
        ).count()
        if total_spam_count > 10:
            author.is_active = False
            author.is_spam = True
            author.save(update_fields=["is_active", "is_spam"])
            send_deactivation_email(author.email)

        # Send an email to admins if the user has 2 or more spam entries within 2 weeks
        spam_count = UserSpamActivity.objects.filter(
            user=author,
            created_at__gte=timezone.now() - timedelta(days=14),
        ).count()
        if spam_count >= 2:
            send_repeated_spam_to_admins_email(
                [x.email for x in recipients],
                author=author,
                content_type="comment",
                # link to admin, as the comment is soft-deleted
                content_url=build_frontend_url(
                    f"/admin/comments/comment/{comment.id}/change/"
                ),
                content_text=comment.text,
            )
        return True

    # Low confidence spam
    send_suspected_spam_to_admins_email(
        [x.email for x in recipients],
        author=author,
        content_type="comment",
        # link to admin, as the comment is soft-deleted
        content_url=build_frontend_url(f"/admin/comments/comment/{comment.id}/change/"),
        content_text=comment.text,
    )

    return False


def create_comment(
    user: User,
    on_post: Post = None,
    parent: Comment = None,
    included_forecast: Forecast = None,
    is_private: bool = False,
    text: str = None,
) -> Comment:
    on_post = parent.on_post if parent else on_post
    should_soft_delete = False

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

        should_soft_delete = check_and_handle_comment_spam(user, obj)

        if not should_soft_delete:
            # Update comments read cache counter
            PostUserSnapshot.update_viewed_at(on_post, user)

    if should_soft_delete:
        obj.is_soft_deleted = True
        obj.save(update_fields=["is_soft_deleted"])
        raise spam_error

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
    should_soft_delete = False

    with transaction.atomic():
        comment_diff = CommentDiff.objects.create(
            comment=comment,
            author=comment.author,
            text_diff=text_diff,
        )

        comment.edit_history.append(comment_diff.id)
        comment.text = text
        comment.text_edited_at = timezone.now()

        should_soft_delete = check_and_handle_comment_spam(comment.author, comment)
        comment.is_soft_deleted = should_soft_delete

        comment.save(
            update_fields=["text", "edit_history", "text_edited_at", "is_soft_deleted"]
        )

    trigger_update_comment_translations(comment)

    if should_soft_delete:
        raise spam_error


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
