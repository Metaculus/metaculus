from collections import Counter
from typing import Iterable

from comments.models import (
    KeyFactor,
    KeyFactorDriver,
    ImpactDirection,
    KeyFactorVote,
    KeyFactorBaseRate,
)
from comments.services.key_factors.common import (
    get_votes_for_key_factors,
    calculate_key_factors_freshness,
)
from questions.models import Question, QuestionPost
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from users.models import User
from users.serializers import BaseUserSerializer
from utils.dtypes import generate_map_from_list


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


def serialize_base_rate_frequency(base_rate: KeyFactorBaseRate) -> dict:
    """Serializes a BaseRate with frequency type"""
    return {
        "type": base_rate.type,
        "reference_class": base_rate.reference_class,
        "rate_numerator": base_rate.rate_numerator,
        "rate_denominator": base_rate.rate_denominator,
        "unit": base_rate.unit,
        "source": base_rate.source,
    }


def serialize_base_rate_trend(base_rate: KeyFactorBaseRate) -> dict:
    """Serializes a BaseRate with trend type"""
    return {
        "type": base_rate.type,
        "reference_class": base_rate.reference_class,
        "projected_value": base_rate.projected_value,
        "projected_by_year": base_rate.projected_by_year,
        "unit": base_rate.unit,
        "extrapolation": base_rate.extrapolation,
        "based_on": base_rate.based_on if base_rate.based_on else None,
        "source": base_rate.source,
    }


def serialize_base_rate(base_rate: KeyFactorBaseRate) -> dict:
    """Serializes a BaseRate based on its type"""
    if base_rate.type == KeyFactorBaseRate.BaseRateType.FREQUENCY:
        return serialize_base_rate_frequency(base_rate)
    elif base_rate.type == KeyFactorBaseRate.BaseRateType.TREND:
        return serialize_base_rate_trend(base_rate)
    else:
        raise ValidationError(f"Unknown BaseRate type: {base_rate.type}")


def serialize_key_factor(
    key_factor: KeyFactor,
    vote_scores: list[KeyFactorVote] = None,
    freshness: float = None,
    question: Question = None,
    question_type: Question.QuestionType = None,
    unit: str = None,
) -> dict:
    return {
        "id": key_factor.id,
        "author": BaseUserSerializer(key_factor.comment.author).data,
        "comment_id": key_factor.comment_id,
        "vote": serialize_key_factor_votes(
            key_factor, vote_scores or [], user_vote=key_factor.user_vote
        ),
        "question_id": key_factor.question_id,
        "question": (
            {
                "id": question.id,
                "label": question.label,
                "unit": question.unit,
            }
            if question
            else None
        ),
        "question_option": key_factor.question_option,
        "freshness": freshness or 0,
        # Type-specific fields
        "driver": (
            KeyFactorDriverSerializer(key_factor.driver).data
            if key_factor.driver
            else None
        ),
        "base_rate": (
            serialize_base_rate(key_factor.base_rate) if key_factor.base_rate else None
        ),
        "post": {
            "id": key_factor.comment.on_post_id,
            "question_type": question_type,
            "unit": unit,
        },
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
            "comment__author", "comment__on_post", "question", "driver", "base_rate"
        )
    )

    if current_user:
        qs = qs.annotate_user_vote(current_user)

    # Restore the original ordering
    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    # Extract user votes
    votes_map = get_votes_for_key_factors(objects)

    # Generate freshness
    freshness_map = calculate_key_factors_freshness(objects, votes_map)

    # Fetch post questions
    post_questions_rel = generate_map_from_list(
        list(
            QuestionPost.objects.filter(
                post_id__in=[x.comment.on_post_id for x in objects]
            )
            .select_related("question")
            .only("post_id", "question__type", "question__unit")
        ),
        key=lambda x: x.post_id,
    )

    serialized_data = []

    for key_factor in objects:
        post_id = key_factor.comment.on_post_id
        questions = [x.question for x in post_questions_rel.get(post_id) or []]

        question_type = questions[0].type if questions else None
        question_units = list({q.unit for q in questions})
        # Use unit if it's same across all questions
        unit = question_units[0] if len(question_units) == 1 else None

        serialized_data.append(
            serialize_key_factor(
                key_factor,
                vote_scores=votes_map.get(key_factor.id),
                freshness=freshness_map.get(key_factor),
                question=key_factor.question,
                question_type=question_type,
                unit=unit,
            )
        )

    return serialized_data


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


class BaseRateSerializer(serializers.ModelSerializer):
    """
    Serializer for KeyFactorBaseRate with type-specific validation
    for 'frequency' and 'trend' base rate types.
    """

    class Meta:
        model = KeyFactorBaseRate
        fields = (
            "type",
            "reference_class",
            "rate_numerator",
            "rate_denominator",
            "projected_value",
            "projected_by_year",
            "unit",
            "extrapolation",
            "based_on",
            "source",
        )

    def validate(self, attrs):
        base_rate_type = attrs.get("type")

        if base_rate_type == KeyFactorBaseRate.BaseRateType.FREQUENCY:
            self._validate_frequency(attrs)
        elif base_rate_type == KeyFactorBaseRate.BaseRateType.TREND:
            self._validate_trend(attrs)

        return attrs

    def _validate_frequency(self, attrs):
        numerator = attrs.get("rate_numerator")
        denominator = attrs.get("rate_denominator")

        if numerator is None:
            raise ValidationError(
                {"rate_numerator": "Rate numerator is required for frequency type"}
            )
        if denominator is None:
            raise ValidationError(
                {"rate_denominator": "Rate denominator is required for frequency type"}
            )

        if numerator < 0:
            raise ValidationError(
                {"rate_numerator": "Rate numerator must be non-negative"}
            )
        if denominator <= 0:
            raise ValidationError(
                {"rate_denominator": "Rate denominator must be positive"}
            )
        if numerator > denominator:
            raise ValidationError(
                {
                    "rate_numerator": "Numerator must be less than or equal to denominator"
                }
            )

    def _validate_trend(self, attrs):
        required_fields = ["projected_value", "projected_by_year", "extrapolation"]

        for field in required_fields:
            if not attrs.get(field):
                raise ValidationError({field: f"{field} is required"})


class KeyFactorWriteSerializer(serializers.ModelSerializer):
    driver = KeyFactorDriverSerializer(required=False)
    base_rate = BaseRateSerializer(required=False)
    question_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = KeyFactor
        fields = (
            "question_id",
            "question_option",
            "driver",
            "base_rate",
        )

    def validate(self, attrs: dict):
        key_factor_types = ["driver", "base_rate"]

        if len([True for kf_type in key_factor_types if attrs.get(kf_type)]) != 1:
            raise ValidationError(
                "Key Factor should have exactly one type-specific object"
            )

        return attrs
