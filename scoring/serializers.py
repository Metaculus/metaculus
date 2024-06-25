from rest_framework import serializers

from scoring.models import LeaderboardEntry


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    user_id = serializers.IntegerField(source="user.id")

    class Meta:
        model = LeaderboardEntry
        fields = "__all__"
