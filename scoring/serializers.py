from rest_framework import serializers

from scoring.models import Leaderboard, LeaderboardEntry


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    user_id = serializers.IntegerField(source="user.id")
    score = serializers.FloatField()
    rank = serializers.IntegerField()
    medal = serializers.CharField()
    prize = serializers.FloatField()
    coverage = serializers.FloatField()
    contribution_count = serializers.IntegerField()
    calculated_on = serializers.DateTimeField()

    class Meta:
        model = LeaderboardEntry
        fields = [
            "username",
            "user_id",
            "score",
            "rank",
            "medal",
            "prize",
            "coverage",
            "contribution_count",
            "calculated_on",
        ]


class LeaderboardSerializer(serializers.Serializer):
    project_id = serializers.IntegerField(source="id")
    score_type = serializers.CharField()
    name = serializers.CharField()
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    finalize_time = serializers.DateTimeField()

    class Meta:
        model = Leaderboard
        fields = [
            "project_id",
            "score_type",
            "name",
            "start_time",
            "end_time",
            "finalize_time",
        ]
