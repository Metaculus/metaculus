from rest_framework import serializers

from comments.models import Comment


class CommentSerializer(serializers.ModelSerializer):
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
