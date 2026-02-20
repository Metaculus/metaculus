from collections import Counter, defaultdict
from typing import Iterable

import numpy as np
from django.db.models import Q
from multidict import MultiDict
from rest_framework import serializers

from questions.models import Question
from questions.serializers.common import serialize_question
from users.models import User
from .models import CoherenceLink, AggregateCoherenceLink, AggregateCoherenceLinkVote
from .services import (
    get_votes_for_aggregate_coherence_links,
    calculate_freshness_aggregate_coherence_link,
)
from .utils import (
    get_aggregation_results,
    link_to_question_id_pair,
    get_aggregations_links,
)


class CoherenceLinkSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    user_id = serializers.IntegerField(required=False)
    username = serializers.SerializerMethodField(required=False)
    question1_id = serializers.IntegerField(required=True)
    question2_id = serializers.IntegerField(required=True)
    direction = serializers.IntegerField(required=True)
    strength = serializers.IntegerField(required=True)

    class Meta:
        model = CoherenceLink
        fields = [
            "id",
            "user_id",
            "username",
            "question1_id",
            "question2_id",
            "direction",
            "strength",
            "type",
        ]
        read_only_fields = ["username"]

    def get_username(self, obj):
        return obj.user.username if obj.user else None


class AggregateCoherenceLinkSerializer(serializers.ModelSerializer):
    question1_id = serializers.IntegerField(required=True)
    question2_id = serializers.IntegerField(required=True)

    class Meta:
        model = AggregateCoherenceLink
        fields = [
            "id",
            "question1_id",
            "question2_id",
            "type",
        ]


class NeedsUpdateQuerySerializer(serializers.Serializer):
    question_ids = serializers.ListField(
        child=serializers.IntegerField(), required=True
    )
    retrieve_all_data = serializers.BooleanField(required=False, default=False)


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


def serialize_coherence_link_many(
    links: Iterable[CoherenceLink], serialize_questions: bool = True
):
    ids = [link.pk for link in links]
    qs = CoherenceLink.objects.filter(pk__in=[c.pk for c in links]).select_related(
        "question1__post", "question2__post", "user"
    )

    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    result = [
        serialize_coherence_link(
            link,
            **(
                {"question1": link.question1, "question2": link.question2}
                if serialize_questions
                else {}
            ),
        )
        for link in objects
    ]

    return result


def serialize_aggregate_coherence_link(
    link: AggregateCoherenceLink,
    question1: Question,
    question2: Question,
    matching_links: list[CoherenceLink],
    votes: list[AggregateCoherenceLinkVote] = None,
    user_vote: int = None,
    current_question: Question = None,
):
    votes = votes or []

    serialized_data = AggregateCoherenceLinkSerializer(link).data
    if question1:
        serialized_data["question1"] = serialize_question(question1)
    if question2:
        serialized_data["question2"] = serialize_question(question2)
    serialized_data["links_nr"] = len(matching_links)
    direction, strength, rsem = get_aggregation_results(list(matching_links), votes)
    serialized_data["direction"] = direction
    serialized_data["strength"] = strength
    serialized_data["rsem"] = rsem if rsem and not np.isnan(rsem) else None

    serialized_data["votes"] = serialize_aggregate_coherence_link_vote(
        votes, user_vote=user_vote
    )

    if current_question:
        serialized_data["freshness"] = calculate_freshness_aggregate_coherence_link(
            current_question, link, votes
        )

    return serialized_data


def serialize_aggregate_coherence_link_many(
    links: Iterable[AggregateCoherenceLink],
    current_user: User = None,
    current_question: Question = None,
):
    ids = [link.pk for link in links]
    qs = AggregateCoherenceLink.objects.filter(
        pk__in=[c.pk for c in links]
    ).select_related("question1__post", "question2__post")

    if current_user:
        qs = qs.annotate_user_vote(current_user)

    aggregate_links = list(qs.all())
    aggregate_links.sort(key=lambda obj: ids.index(obj.id))

    # Prefetching can't work because AggregateCoherenceLink share no relation with CoherenceLink
    all_matching_links = get_aggregations_links(aggregate_links)

    matching_links_by_pair = MultiDict()

    for link in all_matching_links:
        key = link_to_question_id_pair(link)
        matching_links_by_pair.add(key, link)

    # Extract user votes
    votes_map = get_votes_for_aggregate_coherence_links(aggregate_links)

    return [
        serialize_aggregate_coherence_link(
            link,
            question1=link.question1,
            question2=link.question2,
            matching_links=matching_links_by_pair.getall(
                link_to_question_id_pair(link), default=[]
            ),
            votes=votes_map.get(link.id),
            user_vote=link.user_vote,
            current_question=current_question,
        )
        for link in aggregate_links
    ]


def serialize_aggregate_coherence_links_questions_map(
    questions: Iterable[Question], current_user: User = None
) -> dict[int, list[dict]]:
    qs = AggregateCoherenceLink.objects.filter(
        Q(question1__in=questions) | Q(question2__in=questions)
    ).filter_permission(user=current_user)
    questions_map = {q.id: q for q in questions}

    serialized_data = serialize_aggregate_coherence_link_many(
        qs, current_user=current_user
    )
    links_map = defaultdict(list)

    for link in serialized_data:
        for alias in ("question1_id", "question2_id"):
            question = questions_map.get(link[alias])

            if question:
                links_map[question].append(link)

    return links_map


def serialize_coherence_links_questions_map(
    questions: Iterable[Question], current_user: User
) -> dict[int, list[dict]]:
    qs = CoherenceLink.objects.filter(
        Q(question1__in=questions) | Q(question2__in=questions), user=current_user
    )
    questions_map = {q.id: q for q in questions}

    serialized_data = serialize_coherence_link_many(qs)
    links_map = defaultdict(list)

    for link in serialized_data:
        for alias in ("question1_id", "question2_id"):
            question = questions_map.get(link[alias])

            if question:
                links_map[question].append(link)

    return links_map


def serialize_aggregate_coherence_link_vote(
    vote_scores: list[AggregateCoherenceLinkVote],
    user_vote: int = None,
):
    pivot_votes = Counter([v.score for v in vote_scores])

    return {
        "aggregated_data": [
            {"score": score, "count": count} for score, count in pivot_votes.items()
        ],
        "user_vote": user_vote,
        "count": len(vote_scores),
    }
