from rest_framework import serializers
from .models import CoherenceLink

class CoherenceLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoherenceLink
        fields = ['question1', 'question2', 'direction', 'strength', 'user']
        read_only_fields = ['user']

    def create(self, validated_data):
        return CoherenceLink.objects.create(**validated_data)