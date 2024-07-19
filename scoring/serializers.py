from rest_framework import serializers

from scoring.models import Leaderboard, LeaderboardEntry
from users.serializers import BaseUserSerializer


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    user = BaseUserSerializer(required=False)
    score = serializers.FloatField()
    rank = serializers.IntegerField()
    excluded = serializers.BooleanField()
    medal = serializers.CharField()
    prize = serializers.FloatField()
    coverage = serializers.FloatField()
    contribution_count = serializers.IntegerField()
    calculated_on = serializers.DateTimeField()
    take = serializers.FloatField(required=False)
    percent_prize = serializers.FloatField(required=False)

    class Meta:
        model = LeaderboardEntry
        fields = [
            "user",
            "score",
            "rank",
            "excluded",
            "medal",
            "prize",
            "coverage",
            "contribution_count",
            "calculated_on",
            "take",
            "percent_prize",
        ]


class LeaderboardSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    project_type = serializers.CharField(source="project.type")
    project_name = serializers.CharField(source="project.name")
    score_type = serializers.CharField()
    name = serializers.CharField()
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    finalize_time = serializers.DateTimeField()

    class Meta:
        model = Leaderboard
        fields = [
            "project_id",
            "project_type",
            "project_name",
            "score_type",
            "name",
            "start_time",
            "end_time",
            "finalize_time",
        ]


class ContributionSerializer(serializers.Serializer):
    score = serializers.FloatField()
    coverage = serializers.FloatField(required=False)
    question_type = serializers.CharField(source="question.type", required=False)
    question_resolution = serializers.CharField(
        source="question.resolution", required=False
    )
    question_title = serializers.CharField(source="question.title", required=False)
    question_id = serializers.IntegerField(source="question.id", required=False)
    post_title = serializers.CharField(source="post.title", required=False)
    post_id = serializers.IntegerField(source="post.id", required=False)
    comment_text = serializers.CharField(source="comment.text", required=False)
    comment_id = serializers.IntegerField(source="comment.id", required=False)
