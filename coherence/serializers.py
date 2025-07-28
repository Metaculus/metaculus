from rest_framework import serializers
from .models import CoherenceLink


class CoherenceLinkSerializer(serializers.ModelSerializer):
    question1_id = serializers.IntegerField(required=True)
    question2_id = serializers.IntegerField(required=True)
    class Meta:
        model = CoherenceLink
        fields = [
            "question1_id",
            "question2_id",
            "direction",
            "strength",
            "type",
        ]


def serialize_coherence_link(link: CoherenceLink):
    serialized_data = CoherenceLinkSerializer(link).data
    serialized_data["id"] = link.id
    return serialized_data
