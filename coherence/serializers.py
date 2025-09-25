from typing import Iterable

from rest_framework import serializers

from questions.models import Question
from questions.serializers.common import serialize_question
from .models import CoherenceLink, AggregateCoherenceLink
from .utils import get_aggregation_results


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


class AggregateCoherenceLinkSerializer(serializers.ModelSerializer):
    question1_id = serializers.IntegerField(required=True)
    question2_id = serializers.IntegerField(required=True)

    class Meta:
        model = AggregateCoherenceLink
        fields = [
            "question1_id",
            "question2_id",
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


def serialize_link_many(links, model_class, serialize_func):
    ids = [link.pk for link in links]
    qs = model_class.objects.filter(pk__in=[c.pk for c in links]).select_related(
        "question1", "question2"
    )

    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    return [
        serialize_func(link, question1=link.question1, question2=link.question2)
        for link in objects
    ]


def serialize_coherence_link_many(links: Iterable[CoherenceLink]):
    return serialize_link_many(links, CoherenceLink, serialize_coherence_link)


def serialize_aggregate_coherence_link(
        link: AggregateCoherenceLink, question1: Question, question2: Question
):
    serialized_data = AggregateCoherenceLinkSerializer(link).data
    serialized_data["id"] = link.id
    if question1:
        serialized_data["question1"] = serialize_question(question1)
    if question2:
        serialized_data["question2"] = serialize_question(question2)
    matching_links = CoherenceLink.objects.filter(
        question1=question1, question2=question2
    )
    serialized_data["links_nr"] = len(matching_links)
    direction, strength, rsem = get_aggregation_results(list(matching_links))
    serialized_data["direction"] = direction.title() if direction else None
    serialized_data["strength"] = strength.title() if strength else None
    serialized_data["rsem"] = rsem if rsem else None


def serialize_aggregate_coherence_link_many(links: Iterable[AggregateCoherenceLink]):
    return serialize_link_many(links, AggregateCoherenceLink, serialize_aggregate_coherence_link)
