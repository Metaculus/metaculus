import logging
from collections import defaultdict
from datetime import datetime, timezone as dt_timezone, timedelta

import numpy as np
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from posts.models import Post
from questions.constants import ResolutionType
from questions.models import (
    DEFAULT_INBOUND_OUTCOME_COUNT,
    QUESTION_CONTINUOUS_TYPES,
    Question,
    Conditional,
    GroupOfQuestions,
    AggregateForecast,
    AggregationMethod,
)
from questions.models import Forecast
from questions.utils import (
    get_question_movement_period,
    get_last_forecast_in_the_past,
)
from users.models import User
from utils.the_math.aggregations import get_aggregation_history
from utils.the_math.formulas import (
    get_scaled_quartiles_from_cdf,
    unscaled_location_to_scaled_location,
)
from utils.the_math.measures import (
    percent_point_function,
    prediction_difference_for_sorting,
    get_difference_display,
)

logger = logging.getLogger(__name__)


class QuestionSerializer(serializers.ModelSerializer):
    scaling = serializers.SerializerMethodField()
    actual_close_time = serializers.SerializerMethodField()
    resolution = serializers.SerializerMethodField()
    spot_scoring_time = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = (
            "id",
            "title",
            "description",
            "created_at",
            "open_time",
            "cp_reveal_time",
            "spot_scoring_time",
            "scheduled_resolve_time",
            "actual_resolve_time",
            "resolution_set_time",
            "scheduled_close_time",
            "actual_close_time",
            "type",
            # Multiple-choice Questions only
            "options",
            "group_variable",
            # Used for Group Of Questions to determine
            # whether question is eligible for forecasting
            "status",
            "possibilities",
            "resolution",
            "include_bots_in_aggregates",
            "question_weight",
            "resolution_criteria",
            "fine_print",
            "label",
            "unit",
            "open_upper_bound",
            "open_lower_bound",
            "inbound_outcome_count",
            "scaling",
            "group_rank",
        )

    def get_scaling(self, question: Question):
        continuous_range = None
        if question.type in QUESTION_CONTINUOUS_TYPES:

            def format_value(val):
                if val is None or question.type != Question.QuestionType.DATE:
                    return val
                return datetime.fromtimestamp(val, dt_timezone.utc)

            # locations where CDF is evaluated
            continuous_range = []
            for x in np.linspace(
                0, 1, question.inbound_outcome_count or DEFAULT_INBOUND_OUTCOME_COUNT
            ):
                val = unscaled_location_to_scaled_location(x, question)
                continuous_range.append(format_value(val))
        return {
            "range_max": question.range_max,
            "range_min": question.range_min,
            "zero_point": question.zero_point,
            "open_upper_bound": question.open_upper_bound,
            "open_lower_bound": question.open_lower_bound,
            "inbound_outcome_count": question.inbound_outcome_count,
            "continuous_range": continuous_range,
        }

    def get_spot_scoring_time(self, question: Question):
        return question.spot_scoring_time or question.scheduled_close_time

    def get_actual_close_time(self, question: Question):
        if question.actual_close_time:
            return question.actual_close_time
        if question.actual_resolve_time:
            return min(question.scheduled_close_time, question.actual_resolve_time)
        return question.scheduled_close_time

    def get_resolution(self, question: Question):
        resolution = question.resolution

        # The 'resolution' field is a nullable string that may become an empty string
        # during editing in the admin panel.
        # This workaround ensures it is set to null if it truly hasn't been resolved.
        if resolution == "":
            resolution = None

        return resolution


class QuestionWriteSerializer(serializers.ModelSerializer):
    open_time = serializers.DateTimeField(required=False, allow_null=True)
    cp_reveal_time = serializers.DateTimeField(required=False, allow_null=True)
    scheduled_close_time = serializers.DateTimeField(required=False, allow_null=True)
    scheduled_resolve_time = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Question
        fields = (
            "title",
            "description",
            "type",
            "possibilities",
            "resolution",
            "include_bots_in_aggregates",
            "question_weight",
            "range_max",
            "range_min",
            "zero_point",
            "open_upper_bound",
            "open_lower_bound",
            "inbound_outcome_count",
            "options",
            "group_variable",
            "label",
            "resolution_criteria",
            "open_time",
            "cp_reveal_time",
            "scheduled_close_time",
            "scheduled_resolve_time",
            "unit",
            "fine_print",
            "group_rank",
        )

    def validate(self, data: dict):
        errors = []

        published_at = data.get("published_at")
        open_time = data.get("open_time")
        cp_reveal_time = data.get("cp_reveal_time")
        scheduled_close_time = data.get("scheduled_close_time")
        scheduled_resolve_time = data.get("scheduled_resolve_time")
        question_type = data.get("type")

        if published_at:
            if open_time and published_at > open_time:
                errors.append("Publish Time must not be after Open Time")
            if cp_reveal_time and published_at > cp_reveal_time:
                errors.append("Publish Time must not be after CP Reveal Time")
            if scheduled_close_time and published_at > scheduled_close_time:
                errors.append("Publish Time must not be after Closing Time")
            if scheduled_resolve_time and published_at > scheduled_resolve_time:
                errors.append("Publish Time must not be after Resolving Time")
        if open_time:
            if scheduled_close_time and open_time >= scheduled_close_time:
                errors.append("Open Time must be before Closing Time")
            if scheduled_resolve_time and open_time >= scheduled_resolve_time:
                errors.append("Open Time must be before Resolving Time")
        if cp_reveal_time:
            if scheduled_close_time and cp_reveal_time > scheduled_close_time:
                errors.append("CP Reveal Time must not be after Closing Time")
            if scheduled_resolve_time and cp_reveal_time > scheduled_resolve_time:
                errors.append("CP Reveal Time must not be after Resolving Time")
        if scheduled_close_time:
            if scheduled_resolve_time and scheduled_close_time > scheduled_resolve_time:
                errors.append("Closing Time must not be after Resolving Time")

        if question_type == Question.QuestionType.MULTIPLE_CHOICE:
            if not data.get("options"):
                errors.append("Options are required for multiple choice questions")
        if question_type in QUESTION_CONTINUOUS_TYPES:
            if data.get("range_max") is None:
                errors.append("Range Max is required for continuous questions")
            if data.get("range_min") is None:
                errors.append("Range Min is required for continuous questions")

        if errors:
            raise serializers.ValidationError(errors)

        return data


class QuestionUpdateSerializer(QuestionWriteSerializer):
    id = serializers.IntegerField(required=False)

    class Meta(QuestionWriteSerializer.Meta):
        fields = QuestionWriteSerializer.Meta.fields + (
            "id",
            "open_time",
            "cp_reveal_time",
        )

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
            "subquestions_order",
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
            "subquestions_order",
        )

    def validate_questions(self, data: list[str]):
        if not data:
            raise ValidationError("A question group must have at least one subquestion")

        return data


class GroupOfQuestionsUpdateSerializer(GroupOfQuestionsWriteSerializer):
    delete = serializers.ListField(child=serializers.IntegerField(), required=False)
    questions = QuestionUpdateSerializer(many=True, required=True, partial=True)

    class Meta(GroupOfQuestionsWriteSerializer.Meta):
        fields = GroupOfQuestionsWriteSerializer.Meta.fields + ("delete",)


class ForecastSerializer(serializers.ModelSerializer):
    quartiles = serializers.SerializerMethodField()
    scaling = serializers.SerializerMethodField()
    options = serializers.ListField(
        child=serializers.CharField(), source="question.options"
    )
    question_type = serializers.CharField(source="question.type")
    question_unit = serializers.CharField(source="question.unit")

    class Meta:
        model = Forecast
        fields = (
            "start_time",
            "probability_yes",
            "probability_yes_per_category",
            "continuous_cdf",
            "quartiles",
            "scaling",
            "options",
            "question_type",
            "question_unit",
        )

    def get_quartiles(self, forecast: Forecast):
        question = forecast.question
        if question.type in QUESTION_CONTINUOUS_TYPES:
            return get_scaled_quartiles_from_cdf(forecast.continuous_cdf, question)

    def get_scaling(self, forecast: Forecast):
        question = forecast.question
        return {
            "range_max": question.range_max,
            "range_min": question.range_min,
            "zero_point": question.zero_point,
        }


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
            "distribution_input",
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
    histogram = serializers.SerializerMethodField()

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
        question_type = (
            self.context.get("question_type") or aggregate_forecast.question.type
        )
        if (
            question_type == Question.QuestionType.BINARY
            and aggregate_forecast.interval_lower_bounds
        ):
            return aggregate_forecast.interval_lower_bounds[1:]
        return aggregate_forecast.interval_lower_bounds

    def get_centers(self, aggregate_forecast: AggregateForecast) -> list[float] | None:
        question_type = (
            self.context.get("question_type") or aggregate_forecast.question.type
        )
        if question_type == Question.QuestionType.BINARY and aggregate_forecast.centers:
            return aggregate_forecast.centers[1:]
        return aggregate_forecast.centers

    def get_interval_upper_bounds(
        self, aggregate_forecast: AggregateForecast
    ) -> list[float] | None:
        question_type = (
            self.context.get("question_type") or aggregate_forecast.question.type
        )
        if (
            question_type == Question.QuestionType.BINARY
            and aggregate_forecast.interval_upper_bounds
        ):
            return aggregate_forecast.interval_upper_bounds[1:]
        return aggregate_forecast.interval_upper_bounds

    def get_means(self, aggregate_forecast: AggregateForecast) -> list[float] | None:
        question_type = (
            self.context.get("question_type") or aggregate_forecast.question.type
        )
        if question_type == Question.QuestionType.BINARY and aggregate_forecast.means:
            return aggregate_forecast.means[1:]
        return aggregate_forecast.means

    def get_histogram(
        self, aggregate_forecast: AggregateForecast
    ) -> list[list[float]] | None:
        h = aggregate_forecast.histogram
        if not h:  # h is None or []
            return None
        if isinstance(h[0], list):
            return h
        return [h]


class ForecastWriteSerializer(serializers.ModelSerializer):
    question = serializers.IntegerField()

    probability_yes = serializers.FloatField(allow_null=True, required=False)
    probability_yes_per_category = serializers.DictField(
        child=serializers.FloatField(), allow_null=True, required=False
    )
    continuous_cdf = serializers.ListField(
        child=serializers.FloatField(),
        allow_null=True,
        required=False,
    )
    percentiles = serializers.JSONField(allow_null=True, required=False)

    distribution_input = serializers.JSONField(allow_null=True, required=False)

    source = serializers.ChoiceField(
        allow_null=True,
        required=False,
        allow_blank=True,
        choices=Forecast.SourceChoices.choices,
    )

    class Meta:
        model = Forecast
        fields = (
            "question",
            "continuous_cdf",
            "probability_yes",
            "probability_yes_per_category",
            "percentiles",
            "distribution_input",
            "source",
        )

    def binary_validation(self, probability_yes):
        if probability_yes is None:
            raise serializers.ValidationError("probability_yes is required")
        probability_yes = float(probability_yes)
        if probability_yes < 0.001 or probability_yes > 0.999:
            raise serializers.ValidationError(
                "probability_yes should be between 0.001 and 0.999"
            )
        return probability_yes

    def multiple_choice_validation(self, probability_yes_per_category, options):
        if probability_yes_per_category is None:
            raise serializers.ValidationError(
                "probability_yes_per_category is required"
            )
        if not isinstance(probability_yes_per_category, dict):
            raise serializers.ValidationError("Forecast must be a dictionary")
        if set(probability_yes_per_category.keys()) != set(options):
            raise serializers.ValidationError("Forecast must include all options")
        values = [float(probability_yes_per_category[option]) for option in options]
        if not all([0.001 <= v <= 0.999 for v in values]) or not np.isclose(
            sum(values), 1
        ):
            raise serializers.ValidationError(
                "All probabilities must be between 0.001 and 0.999 and sum to 1.0"
            )
        return values

    def continuous_validation(self, continuous_cdf, question: Question):
        if continuous_cdf is None:
            raise serializers.ValidationError(
                "continuous_cdf is required for continuous questions"
            )
        continuous_cdf = np.round(continuous_cdf, 10).tolist()
        errors = ""
        inbound_pmf = np.round(
            [
                continuous_cdf[i + 1] - continuous_cdf[i]
                for i in range(len(continuous_cdf) - 1)
            ],
            10,
        )
        inbound_outcome_count = (
            question.inbound_outcome_count
            if question.inbound_outcome_count
            else DEFAULT_INBOUND_OUTCOME_COUNT
        )
        if len(continuous_cdf) != (inbound_outcome_count + 1):
            errors += (
                f"continuous_cdf for question {question.id} must "
                f"have {inbound_outcome_count + 1} values.\n"
            )
        min_diff = np.round(
            0.01 / inbound_outcome_count,
            10,
        )  # 0.00005 by default
        if not all(inbound_pmf >= min_diff):
            errors += (
                "continuous_cdf must be increasing by at least "
                f"{min_diff} at every step.\n"
            )
        # max diff for default CDF is derived empirically from slider positions
        # TODO: make this lower and scale with inbound_outcome_count
        max_diff = (
            0.59 if len(continuous_cdf) == DEFAULT_INBOUND_OUTCOME_COUNT + 1 else 1
        )
        if not all(inbound_pmf <= max_diff):
            errors += (
                "continuous_cdf must be increasing by no more than "
                f"{max_diff} at every step.\n"
            )
        if question.open_lower_bound:
            if not continuous_cdf[0] >= 0.001:
                errors += (
                    "continuous_cdf at lower bound must be at least 0.001"
                    " due to lower bound being open.\n"
                )
        else:
            if not continuous_cdf[0] == 0.00:
                errors += (
                    "continuous_cdf at lower bound must be 0.00"
                    " due to lower bound being closed.\n"
                )
        if question.open_upper_bound:
            if not continuous_cdf[-1] <= 0.999:
                errors += (
                    "continuous_cdf at upper bound must be at most 0.999"
                    " due to upper bound being open.\n"
                )
        else:
            if not continuous_cdf[-1] == 1.00:
                errors += (
                    "continuous_cdf at upper bound must be 1.00"
                    " due to upper bound being closed.\n"
                )
        if errors:
            raise serializers.ValidationError("CDF Invalid:\n" + errors)

        return continuous_cdf

    def validate(self, data):
        question_id = data.get("question")
        if not question_id:
            raise serializers.ValidationError("question is required")
        question = Question.objects.filter(id=question_id).first()
        if not question:
            raise serializers.ValidationError(
                f"question with id {question_id} does not exist. "
                "Check if you are forecasting with the Post Id accidentally instead."
            )

        probability_yes = data.get("probability_yes")
        probability_yes_per_category = data.get("probability_yes_per_category")
        continuous_cdf = data.get("continuous_cdf")

        if question.type == Question.QuestionType.BINARY:
            if probability_yes_per_category or continuous_cdf:
                raise serializers.ValidationError(
                    "Only probability_yes should be provided for binary questions"
                )
            data["probability_yes"] = self.binary_validation(probability_yes)
        elif question.type == Question.QuestionType.MULTIPLE_CHOICE:
            if probability_yes or continuous_cdf:
                raise serializers.ValidationError(
                    "Only probability_yes_per_category should be "
                    "provided for multiple choice questions"
                )
            data["probability_yes_per_category"] = self.multiple_choice_validation(
                probability_yes_per_category, question.options
            )
        else:  # Continuous question
            if probability_yes or probability_yes_per_category:
                raise serializers.ValidationError(
                    "Only continuous_cdf should be provided for continuous questions"
                )
            data["continuous_cdf"] = self.continuous_validation(
                continuous_cdf, question
            )

        return data


class ForecastWithdrawSerializer(serializers.Serializer):
    question = serializers.IntegerField(required=True)
    withdraw_at = serializers.DateTimeField(required=False)


def serialize_question(
    question: Question,
    current_user: User | None = None,
    post: Post | None = None,
    aggregate_forecasts: list[AggregateForecast] = None,
    full_forecast_values: bool = False,
    minimize: bool = True,
):
    """
    Serializes question object
    """

    serialized_data = QuestionSerializer(question).data
    serialized_data["post_id"] = post.id if post else question.get_post_id()
    serialized_data["aggregations"] = {
        "recency_weighted": {
            "history": [],
            "latest": None,
            "score_data": dict(),
            "movement": None,
        },
        "unweighted": {"history": [], "latest": None, "score_data": dict()},
        "single_aggregation": {"history": [], "latest": None, "score_data": dict()},
        "metaculus_prediction": {
            "history": [],
            "latest": None,
            "score_data": dict(),
        },
    }

    if aggregate_forecasts is not None:
        aggregate_forecasts_by_method: dict[
            AggregationMethod, list[AggregateForecast]
        ] = defaultdict(list)

        movement_period = get_question_movement_period(question)
        movement_start_date = timezone.now() - movement_period
        movement_f1 = None

        for aggregate in aggregate_forecasts:
            if (
                aggregate.method == AggregationMethod.RECENCY_WEIGHTED
                and aggregate.start_time <= movement_start_date
                and aggregate.start_time <= timezone.now()
                and (
                    aggregate.end_time is None
                    or aggregate.end_time > movement_start_date
                )
            ):
                movement_f1 = aggregate

            aggregate_forecasts_by_method[aggregate.method].append(aggregate)

        # Debug method for building aggregation history from scratch
        # Will be replaced in favour of aggregation explorer
        if not minimize:
            aggregate_forecasts_by_method = get_aggregation_history(
                question,
                aggregation_methods=[
                    AggregationMethod.RECENCY_WEIGHTED,
                    AggregationMethod.UNWEIGHTED,
                ],
                minimize=False,
                include_stats=True,
                include_bots=question.include_bots_in_aggregates,
                histogram=True,
            )

        recency_weighted = aggregate_forecasts_by_method.get(
            AggregationMethod.RECENCY_WEIGHTED
        )
        serialized_data["nr_forecasters"] = (
            recency_weighted[-1].forecaster_count if recency_weighted else 0
        )

        if question.is_cp_hidden:
            # don't show any forecasts
            aggregate_forecasts_by_method = {}

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
                    context={
                        "include_forecast_values": full_forecast_values,
                        "question_type": question.type,
                    },
                ).data
            )
            serialized_data["aggregations"][method]["latest"] = (
                (
                    AggregateForecastSerializer(
                        forecasts[-1],
                        context={
                            "include_forecast_values": True,
                            "question_type": question.type,
                        },
                    ).data
                )
                if forecasts
                else None
            )
            movement_f_last = get_last_forecast_in_the_past(forecasts)

            if (
                method == AggregationMethod.RECENCY_WEIGHTED
                and movement_f1
                and movement_f_last
                and movement_start_date
            ):
                serialized_data["aggregations"][method]["movement"] = (
                    serialize_question_movement(
                        question, movement_f1, movement_f_last, movement_period
                    )
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

    return serialized_data


def serialize_conditional(
    conditional: Conditional,
    current_user: User = None,
    post: Post = None,
    aggregate_forecasts: dict[Question, AggregateForecast] = None,
):
    # Serialization of basic data
    serialized_data = ConditionalSerializer(conditional).data

    # Generic questions
    serialized_data["condition"] = serialize_question(
        conditional.condition, post=conditional.condition.get_post()
    )
    serialized_data["condition_child"] = serialize_question(
        conditional.condition_child,
        current_user=current_user,
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
        current_user=current_user,
        post=post,
        aggregate_forecasts=question_no_aggregate_forecasts,
    )

    return serialized_data


def serialize_group(
    group: GroupOfQuestions,
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

    if question.type in [Question.QuestionType.NUMERIC, Question.QuestionType.DISCRETE]:
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
    published_at = serializers.DateTimeField(required=True)
    open_time = serializers.DateTimeField(required=True)
    cp_reveal_time = serializers.DateTimeField(required=True)
    scheduled_close_time = serializers.DateTimeField(required=True)
    scheduled_resolve_time = serializers.DateTimeField(required=True)


def serialize_question_movement(
    question: Question,
    f1: AggregateForecast,
    f2: AggregateForecast,
    period: timedelta,
    threshold: float = 0.0,
) -> dict | None:
    divergence = prediction_difference_for_sorting(
        f1.forecast_values,
        f2.forecast_values,
        question,
    )

    if divergence >= threshold:
        display_diff = get_difference_display(
            f1,
            f2,
            question,
        )

        # Finds max difference for multiple choice cases
        direction, change = max(display_diff, key=lambda x: x[1])

        return {
            "divergence": divergence,
            "direction": direction,
            "movement": change,
            "period": period,
        }

    return
