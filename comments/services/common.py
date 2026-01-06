import datetime
import difflib

from django.db import transaction
from django.db.models import (
    F,
    Sum,
    Count,
    Max,
    OuterRef,
    Subquery,
    IntegerField,
    Avg,
    FloatField,
)
from django.db.models.functions import Coalesce, Abs
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied

from comments.models import (
    ChangedMyMindEntry,
    Comment,
    CommentDiff,
    CommentsOfTheWeekEntry,
    CommentVote,
    KeyFactor,
    KeyFactorVote,
)
from comments.services.spam_detection import check_and_handle_comment_spam
from posts.models import Post, PostUserSnapshot
from projects.models import Project
from projects.permissions import ObjectPermission
from questions.models import Forecast
from users.models import User
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


def create_comment(
    user: User,
    on_post: Post = None,
    parent: Comment = None,
    included_forecast: Forecast = None,
    is_private: bool = False,
    text: str = None,
) -> Comment:
    on_post = parent.on_post if parent else on_post
    root = parent.root or parent if parent else None

    # Inherit root comment privacy
    if root:
        is_private = root.is_private

    if not is_private and user.is_bot and not user.is_primary_bot:
        raise PermissionDenied("Only your primary bot can post public comments.")

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
    else:
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

        comment.save(
            update_fields=["text", "edit_history", "text_edited_at", "is_soft_deleted"]
        )

        if should_soft_delete:
            soft_delete_comment(comment)

    trigger_update_comment_translations(comment)

    if should_soft_delete:
        raise spam_error


def trigger_update_comment_translations(comment: Comment):
    on_post = comment.on_post
    author = comment.author

    # Don't translate comments that are too long
    comment_too_long = len(comment.text) > 10000

    on_private_post = on_post.is_private()
    if (
        not author.is_bot
        and not on_private_post
        and not comment_too_long
        and not comment.is_private
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


@transaction.atomic
def soft_delete_comment(comment: Comment):
    if comment.is_soft_deleted:
        return

    post = comment.on_post

    comment.is_soft_deleted = True
    comment.save(update_fields=["is_soft_deleted"])

    post.update_comment_count()

    if not comment.is_private:
        # Decrement counter during comment deletion
        post.snapshots.filter(viewed_at__gte=comment.created_at).update(
            comments_count=F("comments_count") - 1
        )


def compute_comment_score(
    comment_votes: int,
    change_my_minds: int,
    key_factor_votes_score: int,
    maximum_comment_votes: int,
    maximum_cmms: int,
    maximum_key_factor_score: int,
):
    handicap = 3  # downweight scores that have a maximum << 3
    normalised_comment_votes = (comment_votes + handicap) / (
        maximum_comment_votes + handicap
    )
    normalised_cmms = (change_my_minds + handicap) / (maximum_cmms + handicap)
    normalised_kf_votes = (key_factor_votes_score + handicap) / (
        maximum_key_factor_score + handicap
    )

    cv_weight = 1
    cmm_weight = 1
    kfv_weight = 0.5
    kfv_exponent = 0.5

    # additive score rewards doing well in any
    # exponent flattens: first vote counts more than last
    add_score = cv_weight * normalised_comment_votes
    add_score += cmm_weight * normalised_cmms
    add_score += kfv_weight * normalised_kf_votes**kfv_exponent
    add_score /= cv_weight + cmm_weight + kfv_weight

    # multiplicative scores rewards doing well in all three
    mult_score = normalised_comment_votes**cv_weight
    mult_score *= normalised_cmms**cmm_weight
    mult_score *= normalised_kf_votes**kfv_weight
    mult_score = mult_score ** (1 / (cv_weight + cmm_weight + kfv_weight))

    score = 0.5 * add_score + 0.5 * mult_score
    return score


def set_comment_excluded_from_week_top(comment: Comment, excluded: bool = True):
    entry = comment.comments_of_the_week_entry
    if entry:
        entry.excluded = excluded
        entry.save(update_fields=["excluded"])


def update_top_comments_of_week(week_start_date: datetime.date):
    week_start_datetime = timezone.make_aware(
        datetime.datetime.combine(week_start_date, datetime.time.min)
    )
    week_end_datetime = week_start_datetime + datetime.timedelta(days=7)
    weeks_comments = Comment.objects.filter(
        created_at__gte=week_start_datetime,
        created_at__lt=week_end_datetime,
        on_post__isnull=False,
        on_post__default_project__visibility=Project.Visibility.NORMAL,
    ).exclude(author__is_staff=True)

    comments_of_week = weeks_comments.annotate(
        vote_score=Coalesce(
            Subquery(
                CommentVote.objects.filter(
                    comment=OuterRef("pk"),
                    created_at__gte=F("comment__created_at"),
                    created_at__lt=F("comment__created_at")
                    + datetime.timedelta(days=7),
                )
                .values("comment")
                .annotate(total=Sum("direction"))
                .values("total")[:1],
                output_field=IntegerField(),
            ),
            0,
            output_field=IntegerField(),
        ),
        changed_my_mind_count=Coalesce(
            Subquery(
                ChangedMyMindEntry.objects.filter(
                    comment=OuterRef("pk"),
                    created_at__gte=F("comment__created_at"),
                    created_at__lt=F("comment__created_at")
                    + datetime.timedelta(days=7),
                )
                .values("comment")
                .annotate(total=Count("id"))
                .values("total")[:1],
                output_field=IntegerField(),
            ),
            0,
            output_field=IntegerField(),
        ),
        key_factor_votes_score=Coalesce(
            Subquery(
                KeyFactor.objects.filter(comment=OuterRef("pk"))
                .annotate(
                    avg_score=Coalesce(
                        Subquery(
                            KeyFactorVote.objects.filter(
                                key_factor=OuterRef("pk"),
                                created_at__gte=F("key_factor__comment__created_at"),
                                created_at__lt=F("key_factor__comment__created_at")
                                + datetime.timedelta(days=7),
                            )
                            .exclude(user_id=OuterRef("comment__author_id"))
                            .values("key_factor")
                            .annotate(avg=Avg(Abs("score")))
                            .values("avg")[:1],
                            output_field=FloatField(),
                        ),
                        0.0,
                        output_field=FloatField(),
                    )
                )
                .values("comment")
                .annotate(total=Sum("avg_score"))
                .values("total")[:1],
                output_field=FloatField(),
            ),
            0.0,
            output_field=FloatField(),
        ),
    )

    stats = comments_of_week.aggregate(
        count=Count("id"),
        max_vote_score=Max("vote_score"),
        max_changed_my_mind_count=Max("changed_my_mind_count"),
        max_key_factor_votes_score=Max("key_factor_votes_score"),
    )

    maximum_comment_votes = stats["max_vote_score"]
    maximum_cmms = stats["max_changed_my_mind_count"]
    maximum_key_factor_score = stats["max_key_factor_votes_score"]

    top_comments_of_week: list[CommentsOfTheWeekEntry] = []
    for comment in comments_of_week:
        comment_score = compute_comment_score(
            comment_votes=max(0, comment.vote_score),
            change_my_minds=comment.changed_my_mind_count,
            key_factor_votes_score=comment.key_factor_votes_score,
            maximum_comment_votes=maximum_comment_votes,
            maximum_cmms=maximum_cmms,
            maximum_key_factor_score=maximum_key_factor_score,
        )

        top_comments_of_week.append(
            CommentsOfTheWeekEntry(
                comment=comment,
                score=comment_score,
                created_at=timezone.now(),
                week_start_date=week_start_date,
                # Store snapshot of comment counters
                # for the moment of week entry creation
                votes_score=comment.vote_score,
                changed_my_mind_count=comment.changed_my_mind_count,
                key_factor_votes_score=comment.key_factor_votes_score,
            )
        )

    sorted_comments_of_week = sorted(
        top_comments_of_week, key=lambda x: x.score, reverse=True
    )

    # we need at most 18, out of which admins can exclude some if they want.
    # the non-admin users will always get the top 6 which are not excluded.
    top_18 = sorted_comments_of_week[:18]

    # Bulk create or update entries
    created_entries = CommentsOfTheWeekEntry.objects.bulk_create(
        top_18,
        update_conflicts=True,
        unique_fields=["comment"],
        update_fields=[
            "score",
            "created_at",
            "week_start_date",
            "votes_score",
            "changed_my_mind_count",
            "key_factor_votes_score",
        ],
    )

    # Remove entries for this week that are not in the top 18
    CommentsOfTheWeekEntry.objects.filter(
        week_start_date=week_start_date,
    ).exclude(
        id__in=[entry.id for entry in created_entries],
    ).delete()
