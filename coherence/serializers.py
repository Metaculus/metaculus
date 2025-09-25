from typing import Iterable

from django.db.models import Q
from django.db.models.sql import OR
from multidict import MultiDict
from rest_framework import serializers

from questions.models import Question
from questions.serializers.common import serialize_question
from .models import CoherenceLink, AggregateCoherenceLink
from .utils import get_aggregation_results, link_to_question_id_pair


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


def serialize_coherence_link_many(links: Iterable[CoherenceLink]):
    ids = [link.pk for link in links]
    qs = CoherenceLink.objects.filter(pk__in=[c.pk for c in links]).select_related(
        "question1", "question2"
    )

    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    return [
        serialize_coherence_link(link, question1=link.question1, question2=link.question2)
        for link in objects
    ]


def serialize_aggregate_coherence_link(
        link: AggregateCoherenceLink, question1: Question, question2: Question, matching_links : list[CoherenceLink]
):
    serialized_data = AggregateCoherenceLinkSerializer(link).data
    serialized_data["id"] = link.id
    if question1:
        serialized_data["question1"] = serialize_question(question1)
    if question2:
        serialized_data["question2"] = serialize_question(question2)
    serialized_data["links_nr"] = len(matching_links)
    direction, strength, rsem = get_aggregation_results(list(matching_links))
    serialized_data["direction"] = direction.title().lower() if direction else None
    serialized_data["strength"] = strength.title().lower() if strength else None
    serialized_data["rsem"] = rsem if rsem else None
    return serialized_data


def serialize_aggregate_coherence_link_many(links: Iterable[AggregateCoherenceLink]):
    ids = [link.pk for link in links]
    qs = AggregateCoherenceLink.objects.filter(pk__in=[c.pk for c in links]).select_related(
        "question1", "question2"
    )

    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    question_pairs = {
        (link.question1_id, link.question2_id)
        for link in objects
    }

    # Prefetching can't work because AggregateCoherenceLink share no relation with CoherenceLink
    all_matching_links = CoherenceLink.objects.filter(
        Q(*[Q(question1_id=q1_id, question2_id=q2_id) for q1_id, q2_id in question_pairs],
          _connector=OR))

    matching_links_by_pair = MultiDict()

    for link in all_matching_links:
        key = link_to_question_id_pair(link)
        matching_links_by_pair.add(key, link)

    return [
        serialize_aggregate_coherence_link(link,
                                           question1=link.question1,
                                           question2=link.question2,
                                           matching_links=matching_links_by_pair.getall(link_to_question_id_pair(link))
                                           )
        for link in objects
    ]
