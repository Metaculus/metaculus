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
    entries = LeaderboardEntrySerializer(many=True, source="leaderboardentry")

    class Meta:
        model = Project
        fields = [
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
