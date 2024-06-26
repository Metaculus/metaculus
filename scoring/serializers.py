from rest_framework import serializers

from projects.models import Project
from scoring.models import LeaderboardEntry


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    user_id = serializers.IntegerField(source="user.id")

    class Meta:
        model = LeaderboardEntry
        fields = "__all__"


class LeaderboardSerializer(serializers.Serializer):
    project_id = serializers.IntegerField(source="id")
    type = serializers.CharField()
    leaderboard_type = serializers.CharField()
    name = serializers.CharField()
    slug = serializers.CharField()
    entries = LeaderboardEntrySerializer(many=True, source="leaderboard_entries")
    prize_pool = serializers.IntegerField()
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
