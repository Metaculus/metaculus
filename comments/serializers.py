from rest_framework import serializers
from django.db.models.query import QuerySet

from comments.models import Comment
from posts.models import Post
from users.models import User
from users.serializers import UserCommentSerializer


class CommentSerializer(serializers.ModelSerializer):
    author = UserCommentSerializer()

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
        )


class CommentWriteSerializer(serializers.ModelSerializer):
    on_post = serializers.IntegerField(required=True)
    parent = serializers.IntegerField(required=False, allow_null=True)
    include_forecast = serializers.BooleanField(required=False)
    is_private = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = Comment
        fields = ("on_post", "parent", "include_forecast", "is_private", "text")

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
    serialized_data = CommentSerializer(comment).data

    # Permissions
    # serialized_data["user_permission"] = post.user_permission

    # Annotate user's vote
    serialized_data["vote_score"] = comment.vote_score
    serialized_data["user_vote"] = comment.user_vote

    return serialized_data


def serialize_comment_many(
    comments: QuerySet[Comment] | list[Comment],
    current_user: User | None = None,
) -> list[dict]:
    qs = Comment.objects.filter(pk__in=[c.pk for c in comments])

    qs = qs.annotate_vote_score()

    if current_user and not current_user.is_anonymous:
        qs = qs.annotate_user_vote(current_user)

    return [
        serialize_comment(comment, current_user=current_user) for comment in qs.all()
    ]
