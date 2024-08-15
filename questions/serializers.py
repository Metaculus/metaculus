from datetime import datetime, timezone as dt_timezone

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from posts.models import Post
from questions.models import Forecast
from users.models import User
from utils.the_math.formulas import get_scaled_quartiles_from_cdf
from utils.the_math.measures import prediction_difference_for_display
from .constants import ResolutionType
from .models import Question, Conditional, GroupOfQuestions
from .services import (
    build_question_forecasts_for_user,
    get_forecast_initial_dict,
)


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = (
            "id",
            "title",
            "range_min",
            "range_max",
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
            "resolution_criteria",
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
            "range_max",
            "range_min",
            "zero_point",
            "open_upper_bound",
            "open_lower_bound",
            "options",
            "scheduled_resolve_time",
            "scheduled_close_time",
            "resolution_criteria",
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
            "resolution_criteria",
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
            "resolution_criteria",
            "description",
            "group_variable",
        )


class ForecastSerializer(serializers.ModelSerializer):
    quartiles = serializers.SerializerMethodField()
    range_min = serializers.FloatField(source="question.range_min")
    range_max = serializers.FloatField(source="question.range_max")
    zero_point = serializers.FloatField(source="question.zero_point")
    options = serializers.ListField(
        child=serializers.CharField(), source="question.options"
    )
    question_type = serializers.CharField(source="question.type")

    class Meta:
        model = Forecast
        fields = (
            "start_time",
            "probability_yes",
            "probability_yes_per_category",
            "continuous_cdf",
            "quartiles",
            "range_min",
            "range_max",
            "zero_point",
            "options",
            "question_type",
        )

    def get_quartiles(self, forecast: Forecast):
        question = forecast.question
        if question.type in [Question.QuestionType.DATE, Question.QuestionType.NUMERIC]:
            return get_scaled_quartiles_from_cdf(forecast.continuous_cdf, question)


class ForecastWriteSerializer(serializers.ModelSerializer):
    question = serializers.IntegerField()
    continuous_cdf = serializers.ListField(
        child=serializers.FloatField(),
        allow_null=True,
        required=False,
    )
    probability_yes = serializers.FloatField(allow_null=True, required=False)
    probability_yes_per_category = serializers.DictField(
        child=serializers.FloatField(), allow_null=True, required=False
    )
    slider_values = serializers.JSONField(allow_null=True, required=False)

    class Meta:
        model = Forecast
        fields = (
            "question",
            "continuous_cdf",
            "probability_yes",
            "probability_yes_per_category",
            "slider_values",
        )

    def validate_question(self, value):
        return Question.objects.get(pk=value)


def serialize_question(
    question: Question,
    with_cp: bool = False,
    current_user: User = None,
    post: Post = None,
):
    """
    Serializes question object
    """

    serialized_data = QuestionSerializer(question).data
    serialized_data["post_id"] = post.id

    if with_cp:
        serialized_data["forecasts"] = (
            question.composed_forecasts or get_forecast_initial_dict(question)
        )

        if (
            current_user
            and not current_user.is_anonymous
            and hasattr(question, "user_forecasts")
        ):
            serialized_data["forecasts"]["my_forecasts"] = (
                build_question_forecasts_for_user(question, question.user_forecasts)
            )

            last_forecast = (
                sorted(
                    question.user_forecasts, key=lambda x: x.start_time, reverse=True
                )[0]
                if question.user_forecasts
                else None
            )

            if last_forecast:
                if question.type in ["binary", "multiple_choice"]:
                    cp_prediction_values = serialized_data["forecasts"]["latest_pmf"]
                else:
                    cp_prediction_values = serialized_data["forecasts"]["latest_cdf"]
                if cp_prediction_values is not None:
                    try:
                        serialized_data["display_divergences"] = (
                            prediction_difference_for_display(
                                last_forecast.get_prediction_values(),
                                cp_prediction_values,
                                question,
                            )
                        )
                    except Exception:
                        pass

    serialized_data["resolution"] = question.resolution

    return serialized_data


def serialize_conditional(
    conditional: Conditional,
    with_cp: bool = False,
    current_user: User = None,
    post: Post = None,
):
    # Serialization of basic data
    serialized_data = ConditionalSerializer(conditional).data

    # Generic questions
    serialized_data["condition"] = serialize_question(
        conditional.condition, with_cp=False, post=conditional.condition.get_post()
    )
    serialized_data["condition_child"] = serialize_question(
        conditional.condition_child,
        with_cp=False,
        post=conditional.condition_child.get_post(),
    )

    # Autogen questions
    serialized_data["question_yes"] = serialize_question(
        conditional.question_yes, with_cp=with_cp, current_user=current_user, post=post
    )
    serialized_data["question_no"] = serialize_question(
        conditional.question_no, with_cp=with_cp, current_user=current_user, post=post
    )

    return serialized_data


def serialize_group(
    group: GroupOfQuestions,
    with_cp: bool = False,
    current_user: User = None,
    post: Post = None,
):
    # Serialization of basic data
    serialized_data = GroupOfQuestionsSerializer(group).data
    serialized_data["questions"] = []

    for question in group.questions.all():
        serialized_data["questions"].append(
            serialize_question(
                question, with_cp=with_cp, current_user=current_user, post=post
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
        range_min = question.range_min
        range_max = question.range_max
    else:  # question.type == Question.QuestionType.DATE
        resolution = serializers.DateTimeField().run_validation(resolution)
        range_min = datetime.fromtimestamp(question.range_min, tz=dt_timezone.utc)
        range_max = datetime.fromtimestamp(question.range_max, tz=dt_timezone.utc)

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


class OldForecastWriteSerializer(serializers.Serializer):
    prediction = serializers.FloatField(required=True)

    def validate_prediction(self, value):
        if value < 0.001 or value > 0.999:
            raise serializers.ValidationError(
                "Probability value should be between 0.001 and 0.999"
            )
        return value
