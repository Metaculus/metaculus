from typing import Iterable

from rest_framework import serializers

from questions.models import Question
from questions.serializers.common import serialize_question
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


def serialize_coherence_link(
    link: CoherenceLink, question1: Question = None, question2: Question = None
):
    serialized_data = CoherenceLinkSerializer(link).data
    serialized_data["id"] = link.id
    if question1:
        serialized_data["question1"] = serialize_question(question1)
    if question2:
        serialized_data["question2"] = serialize_question(question2)
    return serialized_data


def serialize_coherence_link_many(links: Iterable[CoherenceLink]):
    ids = [link.pk for link in links]
    qs = CoherenceLink.objects.filter(pk__in=[c.pk for c in links]).select_related(
        "question1", "question2"
    )

    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    return [
        serialize_coherence_link(
            link, question1=link.question1, question2=link.question2
        )
        for link in objects
    ]
