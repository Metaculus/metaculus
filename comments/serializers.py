from rest_framework import serializers

from comments.models import Comment
from posts.models import Post
from questions.models import Forecast
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
    parent = serializers.IntegerField(required=False)
    included_forecast = serializers.IntegerField(required=False)
    is_private = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = Comment
        fields = ("on_post", "parent", "included_forecast", "is_private", "text")

    def validate_on_post(self, value):
        return Post.objects.get(pk=value)

    def validate_parent(self, value):
        return Comment.objects.get(pk=value)

    def validate_included_forecast(self, value):
        return Forecast.objects.get(pk=value)
