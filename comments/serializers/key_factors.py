from collections import Counter
from typing import Iterable

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from comments.models import KeyFactor, KeyFactorDriver, ImpactDirection, KeyFactorVote
from comments.services.key_factors import (
    get_votes_for_key_factors,
    calculate_key_factors_freshness,
)
from questions.models import Question
from users.models import User
from users.serializers import BaseUserSerializer


def serialize_key_factor_votes(
    key_factor: KeyFactor, vote_scores: list[KeyFactorVote], user_vote: int = None
):
    pivot_votes = Counter([v.score for v in vote_scores])

    return {
        "score": key_factor.votes_score,
        "aggregated_data": [
            {"score": score, "count": count} for score, count in pivot_votes.items()
        ],
        "user_vote": user_vote,
        "count": len(vote_scores),
    }


def serialize_key_factor(
    key_factor: KeyFactor,
    vote_scores: list[KeyFactorVote] = None,
    freshness: float = None,
    question: Question = None,
) -> dict:
    return {
        "id": key_factor.id,
        "author": BaseUserSerializer(key_factor.comment.author).data,
        "comment_id": key_factor.comment_id,
        "post_id": key_factor.comment.on_post_id,
        "vote": serialize_key_factor_votes(
            key_factor, vote_scores or [], user_vote=key_factor.user_vote
        ),
        "question_id": key_factor.question_id,
        "question": (
            {
                "id": question.id,
                "label": question.label,
            }
            if question
            else None
        ),
        "question_option": key_factor.question_option,
        "freshness": freshness,
        # Type-specific fields
        "driver": (
            KeyFactorDriverSerializer(key_factor.driver).data
            if key_factor.driver
            else None
        ),
    }


def serialize_key_factors_many(
    key_factors: Iterable[KeyFactor], current_user: User = None
):
    # Get original ordering of the comments
    ids = [p.pk for p in key_factors]
    qs = (
        KeyFactor.objects.filter(pk__in=ids)
        .filter_active()
        .select_related(
            "comment__author", "comment__on_post", "question", "driver", "question"
        )
    )

    if current_user:
        qs = qs.annotate_user_vote(current_user)

    # Restore the original ordering
    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    # Extract user votes
    votes_map = get_votes_for_key_factors(key_factors)

    # Generate freshness
    freshness_map = calculate_key_factors_freshness(key_factors, votes_map)

    return [
        serialize_key_factor(
            key_factor,
            vote_scores=votes_map.get(key_factor.id),
            freshness=freshness_map.get(key_factor),
            question=key_factor.question,
        )
        for key_factor in objects
    ]


class KeyFactorDriverSerializer(serializers.ModelSerializer):
    text = serializers.CharField(max_length=150)
    impact_direction = serializers.ChoiceField(
        choices=ImpactDirection.choices, allow_null=True
    )

    class Meta:
        model = KeyFactorDriver
        fields = ("text", "impact_direction", "certainty")

    def validate(self, attrs):
        if bool(attrs.get("impact_direction")) == bool(attrs.get("certainty")):
            raise serializers.ValidationError(
                "Impact Direction or Certainty is required"
            )

        return attrs


class KeyFactorWriteSerializer(serializers.ModelSerializer):
    driver = KeyFactorDriverSerializer(required=False)
    question_id = serializers.IntegerField(required=False)

    class Meta:
        model = KeyFactor
        fields = (
            "question_id",
            "question_option",
            "driver",
        )

    def validate(self, attrs: dict):
        key_factor_types = ["driver"]

        if len([True for kf_type in key_factor_types if attrs.get(kf_type)]) != 1:
            raise ValidationError(
                "Key Factor should have exactly one type-specific object"
            )

        return attrs
