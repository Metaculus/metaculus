from collections import defaultdict

import sentry_sdk

from questions.models import AggregateForecast, Question
from questions.types import AggregationMethod
from utils.the_math.aggregations import get_aggregation_history


def serialize_aggregate_forecast(
    forecast: AggregateForecast,
    question_type: Question.QuestionType,
    full: bool = False,
) -> dict:
    """
    Serialize an AggregateForecast instance to a dict.

    :param forecast: an AggregateForecast model instance
    :param full: whether to include the extra 'full' fields
    :param question_type: override forecast.question.type if provided
    """

    # Determine question type
    def maybe_strip(values: list[float] | None) -> list[float] | None:
        """If binary question, drop the first element; else return as-is."""
        if question_type == Question.QuestionType.BINARY and values:
            return values[1:]
        return values

    def serialize_histogram(
        h: list[float] | list[list[float]] | None,
    ) -> list[list[float]] | None:
        """Normalize histogram to List[List[float]] or None."""
        if not h:
            return None

        if isinstance(h[0], list):
            return h
        return [h]

    # Base payload
    data: dict = {
        "start_time": forecast.start_time.timestamp(),
        "end_time": forecast.end_time.timestamp() if forecast.end_time else None,
        "forecaster_count": forecast.forecaster_count,
        "interval_lower_bounds": maybe_strip(forecast.interval_lower_bounds),
        "centers": maybe_strip(forecast.centers),
        "interval_upper_bounds": maybe_strip(forecast.interval_upper_bounds),
    }

    if full:
        data["forecast_values"] = forecast.forecast_values
        data["means"] = maybe_strip(forecast.means)
        data["histogram"] = serialize_histogram(forecast.histogram)

    return data


@sentry_sdk.trace
def serialize_question_aggregations(
    question: Question,
    aggregate_forecasts: list[AggregateForecast],
    full_forecast_values: bool = False,
    minimize: bool = True,
) -> dict:
    """
    Serializes questions aggregations.
    Please note: aggregate_forecasts need to be in "start_time" ascending order!
    """

    serialized_data: dict[str, dict] = defaultdict(
        lambda: {
            "history": [],
            "latest": None,
            "score_data": {},
            "movement": None,
        }
    )
    serialized_data[question.default_aggregation_method]  # ensure default method exists

    if aggregate_forecasts is not None:
        aggregate_forecasts_by_method: dict[
            AggregationMethod, list[AggregateForecast]
        ] = defaultdict(list)

        for aggregate in aggregate_forecasts:
            aggregate_forecasts_by_method[aggregate.method].append(aggregate)

        if question.is_cp_hidden:
            # don't show any forecasts
            aggregate_forecasts_by_method = {}

        # Appending score data
        for suffix, scores in (
            ("score", question.scores.all()),
            ("archived_score", question.archived_scores.all()),
        ):
            for score in scores:
                if score.aggregation_method not in serialized_data:
                    continue

                serialized_data[score.aggregation_method]["score_data"][
                    f"{score.score_type}_{suffix}"
                ] = score.score
                if score.score_type == "peer":
                    serialized_data[score.aggregation_method]["score_data"][
                        "coverage"
                    ] = score.coverage
                if score.score_type == "relative_legacy":
                    serialized_data[score.aggregation_method]["score_data"][
                        "weighted_coverage"
                    ] = score.coverage

        for method, forecasts in aggregate_forecasts_by_method.items():
            serialized_data[method]["history"] = [
                serialize_aggregate_forecast(
                    forecast, question.type, full=full_forecast_values
                )
                for forecast in forecasts
            ]
            serialized_data[method]["latest"] = (
                serialize_aggregate_forecast(forecasts[-1], question.type, full=True)
                if forecasts
                else None
            )

    return dict(serialized_data)  # convert defaultdict to dict
