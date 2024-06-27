from rest_framework import serializers

from projects.models import Project
from scoring.models import LeaderboardEntry


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    user_id = serializers.IntegerField(source="user.id")
    leaderboard_type = serializers.CharField()
    score = serializers.FloatField()
    coverage = serializers.FloatField()
    contribution_count = serializers.IntegerField()
    medal = serializers.CharField()
    calculated_on = serializers.DateTimeField()

    class Meta:
        model = LeaderboardEntry
        fields = [
            "username",
            "user_id",
            "leaderboard_type",
            "score",
            "coverage",
            "contribution_count",
            "medal",
            "calculated_on",
        ]


class LeaderboardSerializer(serializers.Serializer):
    project_id = serializers.IntegerField(source="id")
    type = serializers.CharField()
    leaderboard_type = serializers.CharField()
    name = serializers.CharField()
    slug = serializers.CharField()
    entries = serializers.SerializerMethodField()
    prize_pool = serializers.FloatField()
    start_date = serializers.DateTimeField()
    close_date = serializers.DateTimeField()
    is_ongoing = serializers.BooleanField()

    class Meta:
        model = Project
        fields = [
            "project_id",
            "type",
            "leaderboard_type",
            "name",
            "slug",
            "entries",
            "prize_pool",
            "start_date",
            "close_date",
            "is_ongoing",
        ]

    def get_entries(self, project: Project):
        leaderboard_type = (
            self.context.get("leaderboard_type", None) or project.leaderboard_type
        )
        # TODO: remove this N+1 query
        # instead, prefetch specififed leaderboard entries
        entries = LeaderboardEntry.objects.filter(
            project=project, leaderboard_type=leaderboard_type
        ).order_by("-score")
        return LeaderboardEntrySerializer(entries, many=True).data
