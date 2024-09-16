from django.db.models.query import QuerySet
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from comments.models import Comment
from comments.utils import comments_extract_user_mentions_mapping
from posts.models import Post
from questions.serializers import ForecastSerializer
from users.models import User
from users.serializers import BaseUserSerializer


class CommentFilterSerializer(serializers.Serializer):
    parent_isnull = serializers.BooleanField(required=False, allow_null=True)
    post = serializers.IntegerField(required=False, allow_null=True)
    author = serializers.IntegerField(required=False, allow_null=True)
    sort = serializers.CharField(required=False, allow_null=True)
    focus_comment_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_post(self, value: int):
        try:
            return Post.objects.get(pk=value)
        except Post.DoesNotExist:
            raise ValidationError("Post Does not exist")


class CommentSerializer(serializers.ModelSerializer):
    author = BaseUserSerializer()
    changed_my_mind = serializers.SerializerMethodField(read_only=True)
    text = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            "id",
            "author",
            "parent_id",
            "root_id",
            "created_at",
            "is_soft_deleted",
            "text",
            "on_post",
            "included_forecast",
            "is_private",
            "vote_score",
            "changed_my_mind",
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
) -> dict:
    mentions = mentions or []
    serialized_data = CommentSerializer(
        comment, context={"current_user": current_user}
    ).data

    # Permissions
    # serialized_data["user_permission"] = post.user_permission

    forecast = comment.included_forecast
    if forecast is not None:
        serialized_data["included_forecast"] = ForecastSerializer(forecast).data

    serialized_data["mentioned_users"] = BaseUserSerializer(mentions, many=True).data

    # Annotate user's vote
    serialized_data["vote_score"] = comment.vote_score
    serialized_data["user_vote"] = comment.user_vote

    return serialized_data


def serialize_comment_many(
    comments: QuerySet[Comment] | list[Comment],
    current_user: User | None = None,
) -> list[dict]:
    # Get original ordering of the comments
    ids = [p.pk for p in comments]
    qs = Comment.objects.filter(pk__in=[c.pk for c in comments])

    qs = qs.select_related("included_forecast", "author")
    qs = qs.annotate_vote_score()

    if current_user and not current_user.is_anonymous:
        qs = qs.annotate_user_vote(current_user)

    qs = qs.annotate_cmm_info(current_user)

    # Restore the original ordering
    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    mentions_map = comments_extract_user_mentions_mapping(objects)

    return [
        serialize_comment(comment, current_user, mentions=mentions_map.get(comment.id))
        for comment in objects
    ]
