from typing import Self, Union

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from utils.the_math.aggregations import AGGREGATIONS, METHODS_REQUIRING_JOINED_BEFORE
from questions.types import AggregationMethod
from users.models import User


def parse_order_by(value: str) -> tuple[bool, str]:
    """
    Returns (is_desc, field)
    """

    return value.startswith("-"), value.lstrip("-")


def parse_key_lookup(value: str) -> tuple[str, str | None]:
    """
    Parses key lookups like field__lookup
    """

    chunks = value.split("__")

    if len(chunks) != 2:
        return value, None

    return chunks[0], chunks[1]


class SerializerKeyLookupMixin:
    """
    A mixin that allows serializers to handle fields with dynamic suffixes,
    applying the base field's validation to them.
    """

    key_lookup_fields: list[str] = []
    key_lookup_expressions = ["gt", "gte", "lt", "lte"]

    def to_internal_value(self: Union[serializers.Serializer, Self], data):
        # Default processing
        ret = super().to_internal_value(data)
        errors = {}

        for key, value in data.items():
            if key in self.fields:
                continue

            field_name, lookup = parse_key_lookup(key)

            if field_name not in self.key_lookup_fields:
                continue

            if lookup not in self.key_lookup_expressions:
                errors[key] = "Not a valid field key lookup"

            try:
                base_field = self.fields[field_name]
                validated_value = base_field.run_validation(value)
                ret[key] = validated_value
            except serializers.ValidationError as exc:
                errors[key] = exc.detail

        if errors:
            raise serializers.ValidationError(errors)
        return ret


ALL_AGGREGATION_METHODS = "all"


class DataGetRequestSerializer(serializers.Serializer):
    question_id = serializers.IntegerField(required=False)
    post_id = serializers.IntegerField(required=False)
    post_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_null=True
    )
    project_id = serializers.IntegerField(required=False)
    sub_question = serializers.IntegerField(required=False)
    aggregation_methods = serializers.CharField(required=False)
    minimize = serializers.BooleanField(required=False, default=True)
    include_comments = serializers.BooleanField(required=False, default=False)
    include_scores = serializers.BooleanField(required=False, default=True)
    include_user_data = serializers.BooleanField(required=False, allow_null=True)
    user_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_null=True
    )
    include_bots = serializers.BooleanField(required=False, allow_null=True)
    anonymized = serializers.BooleanField(required=False)
    joined_before_date = serializers.DateTimeField(required=False)
    include_key_factors = serializers.BooleanField(required=False, default=False)

    def get_valid_aggregation_methods(self) -> list[str]:
        return [aggregation.method for aggregation in AGGREGATIONS] + [
            AggregationMethod.METACULUS_PREDICTION
        ]

    def validate_aggregation_methods(self, value: str | None):
        valid_aggregation_methods = self.get_valid_aggregation_methods()
        if value is None:
            return
        if value == ALL_AGGREGATION_METHODS:
            # Expanded in validate(), which can also see joined_before_date
            return value
        methods: list[str] = [v.strip() for v in value.split(",")]
        invalid_methods = [
            method for method in methods if method not in valid_aggregation_methods
        ]
        if invalid_methods:
            raise serializers.ValidationError(
                f"Invalid aggregation method(s): {', '.join(invalid_methods)}"
            )
        return methods

    def validate_user_ids(self, user_ids: list[int]):
        if not user_ids:
            return user_ids
        if not (self.context.get("is_staff") or self.context.get("has_data_access")):
            raise serializers.ValidationError(
                "Current user cannot view user-specific data. "
                "Please remove user_ids parameter."
            )
        uids = [int(user_id) for user_id in user_ids]
        return uids

    def validate(self, attrs):
        # Check if there are any unexpected fields
        allowed_fields = {
            "post_id",
            "post_ids",
            "question_id",
            "project_id",
            "sub_question",
            "aggregation_methods",
            "minimize",
            "include_comments",
            "include_scores",
            "include_user_data",
            "user_ids",
            "include_bots",
            "anonymized",
            "joined_before_date",
            "include_key_factors",
        }
        input_fields = set(self.initial_data.keys())
        unexpected_fields = input_fields - allowed_fields
        if unexpected_fields:
            raise ValidationError(f"Unexpected fields: {', '.join(unexpected_fields)}")

        # Aggregation validation logic
        aggregation_methods = attrs.get("aggregation_methods")
        user_ids = attrs.get("user_ids")
        include_bots = attrs.get("include_bots")
        minimize = attrs.get("minimize", True)
        joined_before_date = attrs.get("joined_before_date")

        # Some methods can't be built without a joined_before_date. Asking for one by
        # name without it is an error, while "all" just means "every method we can
        # compute", so there we drop them instead.
        if aggregation_methods == ALL_AGGREGATION_METHODS:
            aggregation_methods = [
                method
                for method in self.get_valid_aggregation_methods()
                if joined_before_date or method not in METHODS_REQUIRING_JOINED_BEFORE
            ]
        elif aggregation_methods and not joined_before_date:
            cohort_methods = [
                method
                for method in aggregation_methods
                if method in METHODS_REQUIRING_JOINED_BEFORE
            ]
            if cohort_methods:
                raise serializers.ValidationError(
                    "joined_before_date is required for aggregation method(s): "
                    f"{', '.join(cohort_methods)}"
                )

        if aggregation_methods:
            user: User = self.context.get("user")
            if not user or not user.is_staff:
                aggregation_methods = [
                    method
                    for method in aggregation_methods
                    if method != AggregationMethod.SINGLE_AGGREGATION
                ]
            attrs["aggregation_methods"] = aggregation_methods

        if not aggregation_methods and (
            (user_ids is not None) or (include_bots is not None) or not minimize
        ):
            raise serializers.ValidationError(
                "If user_ids, include_bots, or minimize is set, "
                "aggregation_methods must also be set."
            )

        return attrs


class DataPostRequestSerializer(DataGetRequestSerializer):
    # For some reason, our POST and GET frontend methods provide
    # different data types for list params. Thus, we need to handle the POST
    # request serialization differently. Without changing the front end, the
    # alternative is to pre-process list fields in the view for GET
    # requests (POST requests have a pretty good format), which is not ideal.
    aggregation_methods = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    user_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_null=True
    )

    def get_valid_aggregation_methods(self) -> list[str]:
        return super().get_valid_aggregation_methods() + ["geometric_mean"]

    def validate_aggregation_methods(self, methods: str | None):
        if methods is None:
            return
        valid_aggregation_methods = self.get_valid_aggregation_methods()
        invalid_methods = [
            method for method in methods if method not in valid_aggregation_methods
        ]
        if invalid_methods:
            raise serializers.ValidationError(
                f"Invalid aggregation method(s): {', '.join(invalid_methods)}"
            )
        return methods

    def validate_user_ids(self, user_ids: list[int]):
        if not user_ids:
            return user_ids
        if not (self.context.get("is_staff") or self.context.get("has_data_access")):
            raise serializers.ValidationError(
                "Current user cannot view user-specific data. "
                "Please remove user_ids parameter."
            )
        uids = [int(user_id) for user_id in user_ids]
        return uids
