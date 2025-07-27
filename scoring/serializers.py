from rest_framework import serializers

from questions.constants import ResolutionType
from scoring.models import Leaderboard, LeaderboardEntry
from users.serializers import BaseUserSerializer


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    user = BaseUserSerializer(required=False)
    aggregation_method = serializers.CharField()
    score = serializers.FloatField()
    rank = serializers.IntegerField()
    excluded = serializers.BooleanField()
    show_when_excluded = serializers.BooleanField()
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
            "aggregation_method",
            "score",
            "rank",
            "excluded",
            "show_when_excluded",
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
    project_slug = serializers.CharField(source="project.slug")
    score_type = serializers.CharField()
    name = serializers.CharField()
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    finalize_time = serializers.DateTimeField()
    prize_pool = serializers.SerializerMethodField()
    max_coverage = serializers.SerializerMethodField()

    class Meta:
        model = Leaderboard
        fields = [
            "project_id",
            "project_type",
            "project_name",
            "project_slug",
            "score_type",
            "name",
            "start_time",
            "end_time",
            "finalize_time",
            "prize_pool",
            "max_coverage",
        ]

    def get_prize_pool(self, obj: Leaderboard):
        if obj.prize_pool is not None:
            return obj.prize_pool
        if obj.project:
            return obj.project.prize_pool

    def get_max_coverage(self, obj: Leaderboard):
        return (
            obj.get_questions()
            .filter(resolution__isnull=False)
            .exclude(resolution__in=[ResolutionType.ANNULLED, ResolutionType.AMBIGUOUS])
            .count()
        )


class ContributionSerializer(serializers.Serializer):
    score = serializers.FloatField()
    coverage = serializers.FloatField(required=False)
    question_type = serializers.CharField(source="question.type", required=False)
    question_resolution = serializers.CharField(
        source="question.resolution", required=False
    )
    question_weight = serializers.FloatField(
        source="question.question_weight", required=False
    )
    question_title = serializers.CharField(source="question.title", required=False)
    question_id = serializers.IntegerField(source="question.id", required=False)
    post_title = serializers.CharField(source="post.title", required=False)
    post_id = serializers.IntegerField(source="post.id", required=False)
    comment_text = serializers.CharField(source="comment.text", required=False)
    comment_id = serializers.IntegerField(source="comment.id", required=False)


class GetLeaderboardSerializer(serializers.Serializer):
    for_user = serializers.IntegerField(required=False)
    project = serializers.IntegerField(required=False)

    score_type = serializers.CharField(required=False)
    start_time = serializers.DateTimeField(required=False)
    end_time = serializers.DateTimeField(required=False)
    name = serializers.CharField(required=False)
    primary = serializers.BooleanField(required=False, default=True)
