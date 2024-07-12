from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from datetime import datetime, timezone as dt_timezone

from django.utils import timezone
from users.models import User
from utils.the_math.measures import prediction_difference_for_display
from .constants import ResolutionType
from .models import Question, Conditional, GroupOfQuestions
from .services import build_question_forecasts, build_question_forecasts_for_user
import numpy as np
from questions.models import Forecast


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = (
            "id",
            "title",
            "min",
            "max",
            "description",
            "created_at",
            "open_time",
            "scheduled_resolve_time",
            "actual_resolve_time",
            "resolution_set_time",
            "scheduled_close_time",
            "actual_close_time",
            "forecast_scoring_ends",
            "type",
            "options",
            "possibilities",
            "resolution",
            "zero_point",
            "resolution_criteria_description",
            "fine_print",
            "label",
            "open_upper_bound",
            "open_lower_bound",
        )


class QuestionWriteSerializer(serializers.ModelSerializer):
    scheduled_resolve_time = serializers.DateTimeField(required=True)
    scheduled_close_time = serializers.DateTimeField(required=True)

    class Meta:
        model = Question
        fields = (
            "title",
            "description",
            "type",
            "possibilities",
            "resolution",
            "max",
            "min",
            "zero_point",
            "open_upper_bound",
            "open_lower_bound",
            "options",
            "scheduled_resolve_time",
            "scheduled_close_time",
            "resolution_criteria_description",
            "fine_print",
        )

    def validate(self, data: dict):
        return data


class ConditionalSerializer(serializers.ModelSerializer):
    """
    Contains basic info about conditional questions
    """

    class Meta:
        model = Conditional
        fields = ("id",)


class ConditionalWriteSerializer(serializers.ModelSerializer):
    condition_id = serializers.IntegerField()
    condition_child_id = serializers.IntegerField()

    class Meta:
        model = Conditional
        fields = ("condition_id", "condition_child_id")

    def validate_condition_id(self, value):
        question = Question.objects.filter(pk=value).first()

        if not question:
            raise ValidationError("Condition does not exist")

        if question.type != Question.QuestionType.BINARY:
            raise ValidationError("Condition can only be binary question")

        return value

    def validate_condition_child_id(self, value):
        question = Question.objects.filter(pk=value).first()

        if not question:
            raise ValidationError("Condition Child does not exist")

        return value


class GroupOfQuestionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupOfQuestions
        fields = (
            "id",
            "description",
            "resolution_criteria_description",
            "fine_print",
            "group_variable",
        )


class GroupOfQuestionsWriteSerializer(serializers.ModelSerializer):
    questions = QuestionWriteSerializer(many=True, required=True, partial=True)

    class Meta:
        model = GroupOfQuestions
        fields = (
            "questions",
            "fine_print",
            "resolution_criteria_description",
            "description",
            "group_variable",
        )


class ForecastSerializer(serializers.ModelSerializer):
    class Meta:
        model = Forecast
        fields = (
            "start_time",
            "probability_yes",
            "probability_yes_per_category",
            "continuous_cdf",
        )


def serialize_question(
    question: Question,
    with_forecasts: bool = False,
    current_user: User = None,
    post_id: int = None,
):
    """
    Serializes question object
    """

    serialized_data = QuestionSerializer(question).data
    serialized_data["post_id"] = post_id

    if with_forecasts:
        if question.cp_reveal_time is None or question.cp_reveal_time > timezone.now():
            serialized_data["forecasts"] = build_question_forecasts(question, True)
        else:
            serialized_data["forecasts"] = build_question_forecasts(question)

        if current_user and not current_user.is_anonymous:
            serialized_data["my_forecasts"] = build_question_forecasts_for_user(
                question, current_user
            )

            last_forecast = (
                question.forecast_set.filter(author=current_user)
                .order_by("start_time")
                .last()
            )
            if last_forecast:
                if question.type in ["binary", "multiple_choice"]:
                    cp_prediction_values = serialized_data["forecasts"]["latest_cdf"]
                else:
                    cp_prediction_values = serialized_data["forecasts"]["latest_pmf"]
                if cp_prediction_values:
                    serialized_data["dispaly_divergences"] = (
                        prediction_difference_for_display(
                            last_forecast.get_prediction_values(),
                            cp_prediction_values,
                            question,
                        )
                    )

    serialized_data["resolution"] = question.resolution

    return serialized_data


def serialize_conditional(
    conditional: Conditional,
    with_forecasts: bool = False,
    current_user: User = None,
    post_id: int = None,
):
    # Serialization of basic data
    serialized_data = ConditionalSerializer(conditional).data

    # Generic questions
    serialized_data["condition"] = serialize_question(
        conditional.condition,
        with_forecasts=False,
        post_id=post_id,
    )
    serialized_data["condition_child"] = serialize_question(
        conditional.condition_child,
        with_forecasts=False,
        post_id=post_id,
    )

    # Autogen questions
    serialized_data["question_yes"] = serialize_question(
        conditional.question_yes,
        with_forecasts=with_forecasts,
        current_user=current_user,
        post_id=post_id,
    )
    serialized_data["question_no"] = serialize_question(
        conditional.question_no,
        with_forecasts=with_forecasts,
        current_user=current_user,
        post_id=post_id,
    )

    return serialized_data


def serialize_group(
    group: GroupOfQuestions,
    with_forecasts: bool = False,
    current_user: User = None,
    post_id: int = None,
):
    # Serialization of basic data
    serialized_data = GroupOfQuestionsSerializer(group).data
    serialized_data["questions"] = []

    for question in group.questions.all():
        serialized_data["questions"].append(
            serialize_question(
                question,
                with_forecasts=with_forecasts,
                current_user=current_user,
                post_id=post_id,
            )
        )

    return serialized_data


def validate_question_resolution(question: Question, resolution: str) -> str:
    if resolution in ResolutionType:
        return resolution

    if question.type == Question.QuestionType.BINARY:
        return serializers.ChoiceField(choices=["yes", "no"]).run_validation(resolution)
    if question.type == Question.QuestionType.MULTIPLE_CHOICE:
        return serializers.ChoiceField(choices=question.options).run_validation(
            resolution
        )

    # Continuous question
    if question.type == Question.QuestionType.NUMERIC:
        resolution = serializers.FloatField().run_validation(resolution)
        range_min = question.min
        range_max = question.max
    else:  # question.type == Question.QuestionType.DATE
        resolution = serializers.DateTimeField().run_validation(resolution)
        range_min = datetime.fromtimestamp(question.min, tz=dt_timezone.utc)
        range_max = datetime.fromtimestamp(question.max, tz=dt_timezone.utc)

    if resolution > range_max and not question.open_upper_bound:
        raise ValidationError(
            f"Resolution must be below {range_max} due to a closed upper bound. "
            f"Received {resolution}"
        )
    if resolution < range_min and not question.open_lower_bound:
        raise ValidationError(
            f"Resolution must be above {range_min} due to a closed lower bound. "
            f"Received {resolution}"
        )
    return str(resolution)
