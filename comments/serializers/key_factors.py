from collections import Counter
from typing import Iterable

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from comments.models import (
    KeyFactor,
    KeyFactorDriver,
    ImpactDirection,
    KeyFactorVote,
    KeyFactorBaseRate,
    KeyFactorNews,
)
from comments.services.key_factors.common import (
    get_votes_for_key_factors,
    calculate_key_factors_freshness,
)
from questions.models import Question, QuestionPost
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


def serialize_news(news: KeyFactorNews) -> dict:
    """Serializes a KeyFactorNews object"""
    return {
        "url": news.url,
        "title": news.title,
        "img_url": news.img_url,
        "source": news.source,
        "published_at": news.published_at,
        "itn_article_id": news.itn_article_id,
    }


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
            BaseRateSerializer(key_factor.base_rate).data
            if key_factor.base_rate
            else None
        ),
        "news": (serialize_news(key_factor.news) if key_factor.news else None),
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
            "comment__author",
            "comment__on_post",
            "question",
            "driver",
            "base_rate",
            "news",
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


class KeyFactorNewsSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating KeyFactorNews
    """

    class Meta:
        model = KeyFactorNews
        fields = (
            "itn_article_id",
            "url",
            "title",
            "img_url",
            "source",
            "published_at",
        )

    def validate(self, attrs):
        itn_article_id = attrs.get("itn_article_id")

        if not itn_article_id:
            for field in ["url", "title", "source"]:
                if not attrs.get(field):
                    raise ValidationError({field: f"{field} is required"})

        return attrs


class KeyFactorWriteSerializer(serializers.ModelSerializer):
    driver = KeyFactorDriverSerializer(required=False)
    base_rate = BaseRateSerializer(required=False)
    news = KeyFactorNewsSerializer(required=False)
    question_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = KeyFactor
        fields = (
            "question_id",
            "question_option",
            "driver",
            "base_rate",
            "news",
        )

    def validate(self, attrs: dict):
        key_factor_types = ["driver", "base_rate", "news"]

        if len([True for kf_type in key_factor_types if attrs.get(kf_type)]) != 1:
            raise ValidationError(
                "Key Factor should have exactly one type-specific object"
            )

        return attrs
