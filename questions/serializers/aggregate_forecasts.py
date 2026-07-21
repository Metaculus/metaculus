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


def _get_latest_aggregate_forecast(
    question: Question, forecasts: list[AggregateForecast]
) -> AggregateForecast | None:
    """
    Pick the aggregate forecast used as the "latest"/default CP preview.

    For questions that have effectively closed (closed or resolved), this is the last
    forecast that was live at ``actual_close_time`` rather than the most recent one.
    Questions resolved as of a past date can keep accumulating aggregate forecasts after
    that date, and the default CP preview must reflect the value at resolution/close
    time, not those later aggregations. ``forecasts`` are expected in ascending
    ``start_time`` order.
    """
    if not forecasts:
        return None

    cutoff = question.actual_close_time
    if cutoff is None:
        return forecasts[-1]

    eligible = [f for f in forecasts if f.start_time <= cutoff]
    # Fall back to the earliest available forecast if every forecast starts after the
    # cutoff (shouldn't normally happen, but keeps a CP visible rather than dropping it).
    return eligible[-1] if eligible else forecasts[0]


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
            latest_forecast = _get_latest_aggregate_forecast(question, forecasts)
            serialized_data[method]["latest"] = (
                serialize_aggregate_forecast(latest_forecast, question.type, full=True)
                if latest_forecast
                else None
            )

    return dict(serialized_data)  # convert defaultdict to dict
