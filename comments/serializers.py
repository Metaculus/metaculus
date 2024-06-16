from rest_framework import serializers

from comments.models import Comment
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
            "edited_at",
            "is_soft_deleted",
            "text",
            "on_post",
            "included_forecast",
            "type",
            "vote_score",
            "children",
        )
