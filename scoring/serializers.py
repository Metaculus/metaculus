from rest_framework import serializers

from scoring.models import LeaderboardEntry


class LeaderboardEntrySerializer(serializers.ModelSerializer):

    class Meta:
        model = LeaderboardEntry
        fields = "__all__"
