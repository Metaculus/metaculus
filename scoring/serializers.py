from rest_framework import serializers

from questions.constants import UnsuccessfulResolutionType
from scoring.models import Leaderboard, LeaderboardEntry
from users.serializers import BaseUserSerializer


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    user = BaseUserSerializer(required=False)
    aggregation_method = serializers.CharField()
    score = serializers.FloatField()
    ci_lower = serializers.FloatField()
    ci_upper = serializers.FloatField()
    rank = serializers.IntegerField()
    # deprecate in favor of exclusion_status
    excluded = serializers.BooleanField()
    show_when_excluded = serializers.BooleanField()
    exclusion_status = serializers.IntegerField()
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
            "ci_lower",
            "ci_upper",
            "rank",
            # deprecate in favor of exclusion_status
            "excluded",
            "show_when_excluded",
            "exclusion_status",
            "medal",
            "prize",
            "coverage",
            "contribution_count",
            "calculated_on",
            "take",
            "percent_prize",
        ]


class LeaderboardSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    project_id = serializers.IntegerField()
    project_type = serializers.CharField(source="project.type")
    project_name = serializers.CharField(source="project.name")
    project_slug = serializers.CharField(source="project.slug")
    is_primary_leaderboard = serializers.SerializerMethodField()
    score_type = serializers.CharField()
    name = serializers.CharField()
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    finalize_time = serializers.DateTimeField()
    finalized = serializers.BooleanField()
    prize_pool = serializers.SerializerMethodField()
    max_coverage = serializers.SerializerMethodField()
    display_config = serializers.JSONField()

    class Meta:
        model = Leaderboard
        fields = [
            "id",
            "project_id",
            "project_type",
            "project_name",
            "project_slug",
            "is_primary_leaderboard",
            "score_type",
            "name",
            "start_time",
            "end_time",
            "finalize_time",
            "finalized",
            "prize_pool",
            "max_coverage",
            "display_config",
        ]

    def get_prize_pool(self, obj: Leaderboard):
        if obj.prize_pool is not None:
            return obj.prize_pool
        if obj.project:
            return obj.project.prize_pool

    def get_max_coverage(self, obj: Leaderboard):
        if self.context.get("include_max_coverage", False):
            return (
                obj.get_questions()
                .filter(resolution__isnull=False)
                .exclude(
                    resolution__in=[
                        UnsuccessfulResolutionType.ANNULLED,
                        UnsuccessfulResolutionType.AMBIGUOUS,
                    ]
                )
                .count()
            )

    def get_is_primary_leaderboard(self, obj: Leaderboard):
        if obj.project and obj.project.primary_leaderboard_id == obj.id:
            return True
        return False


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
    primary_only = serializers.BooleanField(required=False, default=False)
    with_entries = serializers.BooleanField(required=False, default=True)
