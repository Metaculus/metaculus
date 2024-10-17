from collections import defaultdict
from datetime import datetime, timezone as dt_timezone
import numpy as np

import django
import django.utils
import django.utils.timezone
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from posts.models import Post
from questions.models import Forecast
from users.models import User
from utils.the_math.formulas import get_scaled_quartiles_from_cdf
from utils.the_math.measures import (
    percent_point_function,
)
from .constants import ResolutionType
from .models import Question, Conditional, GroupOfQuestions, AggregateForecast


class QuestionSerializer(serializers.ModelSerializer):
    scaling = serializers.SerializerMethodField()
    actual_close_time = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = (
            "id",
            "title",
            "description",
            "created_at",
            "open_time",
            "scheduled_resolve_time",
            "actual_resolve_time",
            "resolution_set_time",
            "scheduled_close_time",
            "actual_close_time",
            "type",
            "options",
            # Used for Group Of Questions to determine
            # whether question is eligible for forecasting
            "status",
            "possibilities",
            "resolution",
            "resolution_criteria",
            "fine_print",
            "label",
            "open_upper_bound",
            "open_lower_bound",
            "scaling",
        )

    def get_scaling(self, question: Question):
        return {
            "range_max": question.range_max,
            "range_min": question.range_min,
            "zero_point": question.zero_point,
        }

    def get_actual_close_time(self, question: Question):
        if question.actual_close_time:
            return question.actual_close_time
        if question.actual_resolve_time:
            return min(question.scheduled_close_time, question.actual_resolve_time)
        return question.scheduled_close_time


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
        # TODO: add validation for continuous question bounds
        return data


class QuestionUpdateSerializer(QuestionWriteSerializer):
    id = serializers.IntegerField(required=False)

    class Meta(QuestionWriteSerializer.Meta):
        fields = QuestionWriteSerializer.Meta.fields + ("id",)

    # TODO: add validation for updating continuous question bounds


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
            "graph_type",
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


class GroupOfQuestionsUpdateSerializer(GroupOfQuestionsWriteSerializer):
    delete = serializers.ListField(child=serializers.IntegerField(), required=False)
    questions = QuestionUpdateSerializer(many=True, required=True, partial=True)

    class Meta(GroupOfQuestionsWriteSerializer.Meta):
        fields = GroupOfQuestionsWriteSerializer.Meta.fields + ("delete",)


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


class MyForecastSerializer(serializers.ModelSerializer):
    start_time = serializers.SerializerMethodField()
    end_time = serializers.SerializerMethodField()
    forecast_values = serializers.SerializerMethodField()
    interval_lower_bounds = serializers.SerializerMethodField()
    centers = serializers.SerializerMethodField()
    interval_upper_bounds = serializers.SerializerMethodField()

    class Meta:
        model = Forecast
        fields = (
            "question_id",
            "author_id",
            "start_time",
            "end_time",
            "forecast_values",
            "interval_lower_bounds",
            "centers",
            "interval_upper_bounds",
            "slider_values",
        )

    def get_start_time(self, forecast: Forecast):
        return forecast.start_time.timestamp()

    def get_end_time(self, forecast: Forecast):
        return forecast.end_time.timestamp() if forecast.end_time else None

    def get_forecast_values(self, forecast: Forecast) -> list[float] | None:
        return forecast.get_prediction_values()

    def get_interval_lower_bounds(self, forecast: Forecast) -> list[float] | None:
        if forecast.continuous_cdf is not None:
            return percent_point_function(forecast.continuous_cdf, [25])

    def get_centers(self, forecast: Forecast) -> list[float] | None:
        if forecast.continuous_cdf is not None:
            return percent_point_function(forecast.continuous_cdf, [50])

    def get_interval_upper_bounds(self, forecast: Forecast) -> list[float] | None:
        if forecast.continuous_cdf is not None:
            return percent_point_function(forecast.continuous_cdf, [75])


class AggregateForecastSerializer(serializers.ModelSerializer):
    start_time = serializers.SerializerMethodField()
    end_time = serializers.SerializerMethodField()
    forecast_values = serializers.SerializerMethodField()
    interval_lower_bounds = serializers.SerializerMethodField()
    centers = serializers.SerializerMethodField()
    interval_upper_bounds = serializers.SerializerMethodField()
    means = serializers.SerializerMethodField()

    class Meta:
        model = AggregateForecast
        fields = (
            "start_time",
            "end_time",
            "forecast_values",
            "forecaster_count",
            "interval_lower_bounds",
            "centers",
            "interval_upper_bounds",
            "means",
            "histogram",
        )

    def get_start_time(self, aggregate_forecast: AggregateForecast):
        return aggregate_forecast.start_time.timestamp()

    def get_end_time(self, aggregate_forecast: AggregateForecast):
        return (
            aggregate_forecast.end_time.timestamp()
            if aggregate_forecast.end_time
            else None
        )

    def get_forecast_values(self, aggregate_forecast: AggregateForecast):
        if self.context.get("include_forecast_values", True):
            return aggregate_forecast.forecast_values

    def get_interval_lower_bounds(
        self, aggregate_forecast: AggregateForecast
    ) -> list[float] | None:
        if (
            len(aggregate_forecast.forecast_values) == 2
        ) and aggregate_forecast.interval_lower_bounds:
            return aggregate_forecast.interval_lower_bounds[1:]
        return aggregate_forecast.interval_lower_bounds

    def get_centers(self, aggregate_forecast: AggregateForecast) -> list[float] | None:
        if (
            len(aggregate_forecast.forecast_values) == 2
        ) and aggregate_forecast.centers:
            return aggregate_forecast.centers[1:]
        return aggregate_forecast.centers

    def get_interval_upper_bounds(
        self, aggregate_forecast: AggregateForecast
    ) -> list[float] | None:
        if (
            len(aggregate_forecast.forecast_values) == 2
        ) and aggregate_forecast.interval_upper_bounds:
            return aggregate_forecast.interval_upper_bounds[1:]
        return aggregate_forecast.interval_upper_bounds

    def get_means(self, aggregate_forecast: AggregateForecast) -> list[float] | None:
        if (len(aggregate_forecast.forecast_values) == 2) and aggregate_forecast.means:
            return aggregate_forecast.means[1:]
        return aggregate_forecast.means


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

    def validate(self, data):
        def is_valid_probability(x):
            return x <= 0.999 and x >= 0.001

        probability_yes = data.get("probability_yes")
        continuous_cdf = data.get("continuous_cdf")
        probability_yes_per_category = data.get("probability_yes_per_category")

        prob_yes_ok = probability_yes is not None and is_valid_probability(
            probability_yes
        )
        prob_yes_per_cat_ok = (
            probability_yes_per_category is not None
            and np.isclose(sum(probability_yes_per_category.values()), 1)
            and all(
                [is_valid_probability(p) for p in probability_yes_per_category.values()]
            )
        )

        continuous_cdf_ok = False
        if continuous_cdf is not None:
            continuous_cdf_increasing = all(
                [
                    continuous_cdf[i + 1] - continuous_cdf[i] >= 0.01 / 201
                    for i in range(len(continuous_cdf) - 1)
                ]
            )

            # Small hack
            question = Question.objects.get(pk=data["question"])

            if question.open_lower_bound:
                lower_bound_ok = continuous_cdf[0] >= 0.001
            else:
                lower_bound_ok = continuous_cdf[0] == 0.00
            if question.open_upper_bound:
                upper_bound_ok = continuous_cdf[-1] <= 0.999
            else:
                upper_bound_ok = continuous_cdf[-1] == 1.00
            continuous_cdf_ok = (
                continuous_cdf is not None
                and continuous_cdf_increasing
                and lower_bound_ok
                and upper_bound_ok
                and len(continuous_cdf) == 201
            )

        if not (prob_yes_ok or prob_yes_per_cat_ok or continuous_cdf_ok):
            raise serializers.ValidationError("Invalid forecast values")

        return data


def serialize_question(
    question: Question,
    with_cp: bool = False,
    current_user: User | None = None,
    post: Post | None = None,
    aggregate_forecasts: list[AggregateForecast] = None,
    full_forecast_values: bool = False,
):
    """
    Serializes question object
    """

    serialized_data = QuestionSerializer(question).data
    serialized_data["post_id"] = post.id if post else question.get_post().id
    serialized_data["aggregations"] = {
        "recency_weighted": {"history": [], "latest": None, "score_data": dict()},
        "unweighted": {"history": [], "latest": None, "score_data": dict()},
        "single_aggregation": {"history": [], "latest": None, "score_data": dict()},
        "metaculus_prediction": {
            "history": [],
            "latest": None,
            "score_data": dict(),
        },
    }

    if with_cp:
        if (
            question.cp_reveal_time
            and question.cp_reveal_time > django.utils.timezone.now()
        ):
            aggregate_forecasts = []
        elif aggregate_forecasts is None:
            aggregate_forecasts = question.aggregate_forecasts.all()

        aggregate_forecasts_by_method = defaultdict(list)
        for aggregate in aggregate_forecasts:
            aggregate_forecasts_by_method[aggregate.method].append(aggregate)

        # Appending score data
        for suffix, scores in (
            ("score", question.scores.all()),
            ("archived_score", question.archived_scores.all()),
        ):
            for score in scores:
                if score.aggregation_method not in serialized_data["aggregations"]:
                    continue

                serialized_data["aggregations"][score.aggregation_method]["score_data"][
                    f"{score.score_type}_{suffix}"
                ] = score.score
                if score.score_type == "peer":
                    serialized_data["aggregations"][score.aggregation_method][
                        "score_data"
                    ]["coverage"] = score.coverage
                if score.score_type == "relative_legacy":
                    serialized_data["aggregations"][score.aggregation_method][
                        "score_data"
                    ]["weighted_coverage"] = score.coverage

        for method, forecasts in aggregate_forecasts_by_method.items():
            serialized_data["aggregations"][method]["history"] = (
                AggregateForecastSerializer(
                    forecasts,
                    many=True,
                    context={"include_forecast_values": full_forecast_values},
                ).data
            )
            serialized_data["aggregations"][method]["latest"] = (
                (
                    AggregateForecastSerializer(
                        forecasts[-1],
                        context={"include_forecast_values": True},
                    ).data
                )
                if forecasts and not full_forecast_values
                else None
            )

        if (
            current_user
            and not current_user.is_anonymous
            and hasattr(question, "request_user_forecasts")
        ):
            scores = question.user_scores
            archived_scores = question.user_archived_scores
            user_forecasts = question.request_user_forecasts
            serialized_data["my_forecasts"] = {
                "history": MyForecastSerializer(
                    user_forecasts,
                    context={"include_forecast_values": False},
                    many=True,
                ).data,
                "latest": (
                    MyForecastSerializer(
                        user_forecasts[-1],
                    ).data
                    if user_forecasts
                    else None
                ),
                "score_data": dict(),
            }
            for score in scores:
                serialized_data["my_forecasts"]["score_data"][
                    score.score_type + "_score"
                ] = score.score
                if score.score_type == "peer":
                    serialized_data["my_forecasts"]["score_data"][
                        "coverage"
                    ] = score.coverage
                if score.score_type == "relative_legacy":
                    serialized_data["my_forecasts"]["score_data"][
                        "weighted_coverage"
                    ] = score.coverage
            for score in archived_scores:
                serialized_data["my_forecasts"]["score_data"][
                    score.score_type + "_archived_score"
                ] = score.score
                if score.score_type == "peer":
                    serialized_data["my_forecasts"]["score_data"][
                        "coverage"
                    ] = score.coverage
                if score.score_type == "relative_legacy":
                    serialized_data["my_forecasts"]["score_data"][
                        "weighted_coverage"
                    ] = score.coverage

    serialized_data["resolution"] = question.resolution
    return serialized_data


def serialize_conditional(
    conditional: Conditional,
    with_cp: bool = False,
    current_user: User = None,
    post: Post = None,
    aggregate_forecasts: dict[Question, AggregateForecast] = None,
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
    question_yes_aggregate_forecasts = (
        aggregate_forecasts.get(conditional.question_yes) or []
        if aggregate_forecasts
        else None
    )
    serialized_data["question_yes"] = serialize_question(
        conditional.question_yes,
        with_cp=with_cp,
        current_user=current_user,
        post=post,
        aggregate_forecasts=question_yes_aggregate_forecasts,
    )
    question_no_aggregate_forecasts = (
        aggregate_forecasts.get(conditional.question_no) or []
        if aggregate_forecasts
        else None
    )
    serialized_data["question_no"] = serialize_question(
        conditional.question_no,
        with_cp=with_cp,
        current_user=current_user,
        post=post,
        aggregate_forecasts=question_no_aggregate_forecasts,
    )

    return serialized_data


def serialize_group(
    group: GroupOfQuestions,
    with_cp: bool = False,
    current_user: User = None,
    post: Post = None,
    aggregate_forecasts: dict[Question, AggregateForecast] = None,
):
    # Serialization of basic data
    serialized_data = GroupOfQuestionsSerializer(group).data
    serialized_data["questions"] = []

    questions = group.questions.all()
    for question in questions:
        serialized_data["questions"].append(
            serialize_question(
                question,
                with_cp=with_cp,
                current_user=current_user,
                post=post,
                aggregate_forecasts=(
                    aggregate_forecasts.get(question) or []
                    if aggregate_forecasts
                    else None
                ),
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
    if resolution == "above_upper_bound":
        if not question.open_upper_bound:
            raise ValidationError(
                "Resolution must be below the upper bound due to a closed upper bound."
            )
        return resolution
    if resolution == "below_lower_bound":
        if not question.open_lower_bound:
            raise ValidationError(
                "Resolution must be above the lower bound due to a closed lower bound."
            )
        return resolution

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


class QuestionApproveSerializer(serializers.Serializer):
    question_id = serializers.IntegerField(required=True)
    open_time = serializers.DateTimeField(required=True)
    cp_reveal_time = serializers.DateTimeField(required=True)
