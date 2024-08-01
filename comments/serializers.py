from rest_framework import serializers
from django.db.models.query import QuerySet

from comments.models import Comment
from posts.models import Post
from questions.serializers import ForecastSerializer
from users.models import User
from users.serializers import BaseUserSerializer


class CommentSerializer(serializers.ModelSerializer):
    author = BaseUserSerializer()
    parent = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    changed_my_mind = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comment
        fields = (
            "id",
            "author",
            "parent",
            "created_at",
            "is_soft_deleted",
            "text",
            "on_post",
            "included_forecast",
            "is_private",
            "vote_score",
            "children",
            "changed_my_mind",
        )

    def get_parent(self, comment: Comment):
        if comment.parent:
            parent = comment.parent
            return {
                "id": parent.id,
                "on_post": parent.on_post.id,
                "author": BaseUserSerializer(parent.author).data,
            }
        return None

    def get_children(self, comment: Comment):
        children = Comment.objects.filter(parent=comment)
        return serialize_comment_many(children, self.context.get("current_user"))

    def get_changed_my_mind(self, comment:Comment) -> dict[str, bool | int]:
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
) -> dict:
    serialized_data = CommentSerializer(
        comment, context={"current_user": current_user}
    ).data

    # Permissions
    # serialized_data["user_permission"] = post.user_permission

    forecast = comment.included_forecast
    if forecast is not None:
        serialized_data["included_forecast"] = ForecastSerializer(forecast).data

    # Annotate user's vote
    serialized_data["vote_score"] = comment.vote_score
    serialized_data["user_vote"] = comment.user_vote

    return serialized_data


def serialize_comment_many(
    comments: QuerySet[Comment] | list[Comment],
    current_user: User | None = None,
) -> list[dict]:
    qs = Comment.objects.filter(pk__in=[c.pk for c in comments])

    qs = qs.select_related("included_forecast")
    qs = qs.annotate_vote_score()

    if current_user and not current_user.is_anonymous:
        qs = qs.annotate_user_vote(current_user)

    qs = qs.annotate_cmm_info(current_user)

    return [serialize_comment(comment, current_user) for comment in qs.all()]
