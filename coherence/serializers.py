from rest_framework import serializers
from .models import CoherenceLink

class CoherenceLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoherenceLink
        fields = ['question1', 'question2', 'direction', 'strength', 'user', 'id']
        read_only_fields = ['user', 'id']

    def create(self, validated_data):
        return CoherenceLink.objects.create(**validated_data)