from typing import Iterable

from django.db.models.query import QuerySet
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from comments.models import Comment, KeyFactor, KeyFactorVote
from comments.services.key_factors import get_user_votes_for_key_factors
from comments.utils import comments_extract_user_mentions_mapping
from posts.models import Post
from posts.services.common import get_posts_staff_users
from projects.permissions import ObjectPermission
from questions.serializers import ForecastSerializer
from users.models import User
from users.serializers import BaseUserSerializer
from utils.dtypes import flatten, generate_map_from_list


class CommentFilterSerializer(serializers.Serializer):
    parent_isnull = serializers.BooleanField(required=False, allow_null=True)
    post = serializers.IntegerField(required=False, allow_null=True)
    author = serializers.IntegerField(required=False, allow_null=True)
    sort = serializers.CharField(required=False, allow_null=True)
    focus_comment_id = serializers.IntegerField(required=False, allow_null=True)
    is_private = serializers.BooleanField(required=False, allow_null=True)
    include_deleted = serializers.BooleanField(required=False, allow_null=True)

    def validate_post(self, value: int):
        try:
            return Post.objects.get(pk=value)
        except Post.DoesNotExist:
            raise ValidationError("Post Does not exist")


class CommentSerializer(serializers.ModelSerializer):
    author = BaseUserSerializer()
    changed_my_mind = serializers.SerializerMethodField(read_only=True)
    text = serializers.SerializerMethodField()
    on_post_data = serializers.SerializerMethodField()
    included_forecast = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comment
        fields = (
            "id",
            "author",
            "parent_id",
            "root_id",
            "created_at",
            "text_edited_at",
            "is_soft_deleted",
            "text",
            "on_post",
            "on_post_data",
            "included_forecast",
            "is_private",
            "vote_score",
            "changed_my_mind",
            "is_pinned",
        )

    def get_changed_my_mind(self, comment: Comment) -> dict[str, bool | int]:
        changed_my_mind_count = 0
        user_has_changed_my_mind = False

        if hasattr(comment, "changed_my_mind_count") and hasattr(
            comment, "user_has_changed_my_mind"
        ):
            changed_my_mind_count = comment.changed_my_mind_count
            user_has_changed_my_mind = comment.user_has_changed_my_mind

        return {
            "count": changed_my_mind_count,
            "for_this_user": user_has_changed_my_mind,
        }

    def get_text(self, value: Comment):
        return _("deleted") if value.is_soft_deleted else value.text

    def get_on_post_data(self, value: Comment):
        """
        Minimalistic serialization version of post object
        Could be replaced with `serialize_post_many` call
        in `serialize_comment_many` function in the future
        """

        return {"id": value.on_post_id, "title": getattr(value.on_post, "title", "")}

    def get_included_forecast(self, value: Comment):
        if value.is_soft_deleted or not value.included_forecast:
            return None
        return ForecastSerializer(value.included_forecast).data


class OldAPICommentWriteSerializer(serializers.Serializer):
    comment_text = serializers.CharField(required=True)
    question = serializers.PrimaryKeyRelatedField(required=True, queryset=Post.objects)
    submit_type = serializers.ChoiceField(required=True, choices=["N", "S"])
    include_latest_prediction = serializers.BooleanField(required=False)

    def validated_question(self, value):
        return Post.objects.get(pk=value)


class CommentWriteSerializer(serializers.ModelSerializer):
    on_post = serializers.IntegerField(required=True)
    parent = serializers.IntegerField(required=False, allow_null=True)
    is_private = serializers.BooleanField(required=False, default=False)
    included_forecast = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = Comment
        fields = ("on_post", "parent", "included_forecast", "is_private", "text")

    def validate_on_post(self, value):
        return Post.objects.get(pk=value)

    def validate_parent(self, value):
        if not value:
            return value

        return Comment.objects.get(pk=value)


def serialize_comment(
    comment: Comment,
    current_user: User | None = None,
    mentions: list[User] | None = None,
    author_staff_permission: ObjectPermission = None,
    key_factors: list[KeyFactor] = None,
) -> dict:
    mentions = mentions or []
    serialized_data = CommentSerializer(
        comment, context={"current_user": current_user}
    ).data

    # Permissions
    # serialized_data["user_permission"] = post.user_permission

    serialized_data["mentioned_users"] = BaseUserSerializer(mentions, many=True).data

    # Annotate user's vote
    serialized_data["vote_score"] = comment.vote_score
    serialized_data["user_vote"] = comment.user_vote
    serialized_data["author_staff_permission"] = author_staff_permission

    serialized_data["is_current_content_translated"] = (
        comment.is_current_content_translated()
    )
    serialized_data["key_factors"] = key_factors or []

    return serialized_data


def serialize_comment_many(
    comments: QuerySet[Comment] | list[Comment],
    current_user: User | None = None,
    with_key_factors: bool = False,
) -> list[dict]:
    # Get original ordering of the comments
    ids = [p.pk for p in comments]
    qs = Comment.objects.filter(pk__in=[c.pk for c in comments])

    qs = qs.select_related(
        "included_forecast__question", "author", "on_post"
    ).prefetch_related("key_factors")
    qs = qs.annotate_vote_score()

    if current_user and not current_user.is_anonymous:
        qs = qs.annotate_user_vote(current_user)

    qs = qs.annotate_cmm_info(current_user)

    # Restore the original ordering
    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    # Extracting staff users
    post_staff_users_map = get_posts_staff_users(
        {c.on_post for c in objects if c.on_post}
    )
    mentions_map = comments_extract_user_mentions_mapping(objects)

    # Extracting key factors
    comment_key_factors_map = {}
    if with_key_factors:
        comment_key_factors_map = generate_map_from_list(
            serialize_key_factors_many(
                flatten([c.key_factors.all() for c in objects]),
                current_user=current_user,
            ),
            key=lambda x: x["comment_id"],
        )

    return [
        serialize_comment(
            comment,
            current_user,
            mentions=mentions_map.get(comment.id),
            author_staff_permission=(
                post_staff_users_map.get(comment.on_post, {}).get(comment.author_id)
            ),
            key_factors=comment_key_factors_map.get(comment.id),
        )
        for comment in objects
    ]


def serialize_key_factor(
    key_factor: KeyFactor, user_votes: list[KeyFactorVote] = None
) -> dict:
    user_votes = user_votes or []

    return {
        "id": key_factor.id,
        "text": key_factor.text,
        "author": BaseUserSerializer(key_factor.comment.author).data,
        "comment_id": key_factor.comment_id,
        "post_id": key_factor.comment.on_post_id,
        "user_votes": [
            {"vote_type": vote.vote_type, "score": vote.score} for vote in user_votes
        ],
        "votes_score": key_factor.votes_score,
        "vote_type": key_factor.vote_type,
    }


def serialize_key_factors_many(
    key_factors: Iterable[KeyFactor], current_user: User = None
):
    # Get original ordering of the comments
    ids = [p.pk for p in key_factors]
    qs = (
        KeyFactor.objects.filter(pk__in=[c.pk for c in key_factors])
        .filter_active()
        .select_related("comment__author")
    )

    # Restore the original ordering
    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    # Extract user votes
    user_votes_map = (
        get_user_votes_for_key_factors(key_factors, current_user)
        if current_user and not current_user.is_anonymous
        else {}
    )

    return [
        serialize_key_factor(key_factor, user_votes=user_votes_map.get(key_factor.id))
        for key_factor in objects
    ]
