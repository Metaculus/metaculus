from rest_framework import serializers
from .models import CoherenceLink


class CoherenceLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoherenceLink
        fields = [
            "question1",
            "question2",
            "direction",
            "strength",
            "type",
        ]


def serialize_coherence_link(link: CoherenceLink):
    serialized_data = CoherenceLinkSerializer(link).data
    serialized_data["id"] = link.id
    return serialized_data
