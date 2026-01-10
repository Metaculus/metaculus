from collections import defaultdict
from typing import TypedDict, Iterable

from django.db.models import F
from django.utils import timezone

from posts.models import Post
from projects.models import ProjectIndex
from questions.constants import QuestionStatus
from questions.models import AggregateForecast, Question
from questions.utils import get_last_forecast_in_the_past
from utils.dtypes import generate_map_from_list, flatten
from utils.the_math.aggregations import minimize_history
from utils.the_math.formulas import string_location_to_unscaled_location

IndexPoint = TypedDict("IndexPoint", {"x": int, "y": float})
QuestionsAggMap = dict[int, list[AggregateForecast]]


def _get_index_posts_with_weights(index: ProjectIndex) -> dict[Post, float]:
    """
    Return a {post: weight} mapping for the given project's index.
    """
    posts = (
        Post.objects.filter(index_weights__index=index)
        .filter_published()
        .prefetch_related("questions")
        .annotate(_weight=F("index_weights__weight"))
    )

    return {post: float(post._weight) for post in posts}


def _generate_questions_agg_map(
    questions: Iterable[Question],
) -> QuestionsAggMap:
    aggregate_forecasts = (
        AggregateForecast.objects.filter_default_aggregation()
        .filter(question__in=questions)
        .filter(start_time__lte=timezone.now())
        .only(
            "question_id",
            "forecast_values",
            "start_time",
            "end_time",
            "centers",
            "interval_upper_bounds",
            "interval_lower_bounds",
        )
        .order_by("start_time")
    )

    return generate_map_from_list(
        aggregate_forecasts,
        lambda agg: agg.question_id,
    )


def _value_from_forecast(question: Question, forecast: AggregateForecast) -> float:
    """
    Convert a single question's AggregateForecast into a normalized index contribution.

    Returns a value in [0, 1] Later we scale to [min, max] for presentation.
    Mapping rules:
      - Binary: use probability of "yes" (centers[1]) mapped to [0, 1]
      - Numeric/Date/Discrete: use mean survival mass = average(1 - CDF)
    If necessary data is missing, returns 0.5
    """

    if question.type == Question.QuestionType.BINARY:
        centers = forecast.centers or []
        if len(centers) >= 2 and centers[1] is not None:
            p_yes = float(centers[1])
            return p_yes
        return 0.5

    # Continuous
    cdf = forecast.forecast_values or []
    if not cdf:
        return 0.5

    # We use this formula instead of the original
    # According to this ticket - https://github.com/Metaculus/metaculus/issues/2471
    return 1.0 - (sum(cdf) / len(cdf))


def _value_from_bounds(points: list[float]) -> float:
    return float(points[-1]) if points else 0.5


def _value_from_resolved_question(question: Question) -> float | None:
    """
    Generating index value from resolved question.
    """

    unscaled_resolution = string_location_to_unscaled_location(
        question.resolution, question
    )

    if unscaled_resolution is None:
        return

    # Handle resolutions outside the lower/upper bounds
    # < the lower bound -> 0 -> results in -1
    # > the upper bound -> 1 -> results in +1
    unscaled_resolution = min(unscaled_resolution, 1.0)
    unscaled_resolution = max(unscaled_resolution, 0)

    return unscaled_resolution


def calculate_questions_index_timeline(
    question_indexes_map: dict[Question, float],
    forecasts_by_question: QuestionsAggMap,
    index_min: float,
    index_max: float,
    max_points: int = 400,
) -> list[IndexPoint]:
    """
    Build a minimized timeline of the project's index.

    Returns a dict with keys:
      - line: List[IndexPoint as dict]
      - timestamps: List[int] (unix seconds)
    where y values are scaled to [-100, 100].
    """

    questions = question_indexes_map.keys()
    all_datetimes = list(
        {
            # Extract start times from all grouped forecasts
            *(
                agg.start_time
                for forecasts in forecasts_by_question.values()
                for agg in forecasts
            ),
            # Append actual resolution dates when accurate
            *(q.actual_resolve_time for q in questions if q.actual_resolve_time),
            # Append actual close dates when accurate
            *(q.actual_close_time for q in questions if q.actual_close_time),
            # Always include now
            timezone.now(),
        }
    )

    # Sort dates again
    all_datetimes.sort()

    # Down-sample timeline
    sampled_datetimes = minimize_history(all_datetimes, max_size=max_points)
    line: list[IndexPoint] = []

    for dt in sampled_datetimes:
        # Some questions might not have forecasts for the given period
        # So we should not include their weights to the denominator
        # So we need to calculate weight_sum individually for each iteration
        weight_sum = 0.0
        score_sum = 0.0

        for question, weight in question_indexes_map.items():
            history = forecasts_by_question.get(question.id)

            value = None

            # Handle resolved questions index
            if question.actual_resolve_time and dt >= question.actual_resolve_time:
                value = _value_from_resolved_question(question)
            else:
                if not history:
                    continue
                # TODO: this one is not very optimized, so need to propose different solution for loop!
                if agg := get_last_forecast_in_the_past(history, at_time=dt):
                    value = _value_from_forecast(question, agg)

            if value is not None:
                weight_sum += abs(weight)
                score_sum += weight * (2 * value - 1)  # scale to [-1, 1] for aggregate

        # Normalize back to [0, 1] and scale to index range [min, max]
        y = (score_sum / weight_sum + 1) / 2 if weight_sum != 0 else 0.5
        line.append(
            {"x": int(dt.timestamp()), "y": index_min + y * (index_max - index_min)}
        )

    return line


def calculate_questions_index_bounds(
    question_indexes_map: dict[Question, float],
    forecasts_by_question: QuestionsAggMap,
    index_min: float,
    index_max: float,
) -> tuple[float, float]:
    """
    Compute lower/upper index values for the current date
    """
    now = timezone.now()
    weight_sum = lower_sum = upper_sum = 0.0

    for question, weight in question_indexes_map.items():
        history = forecasts_by_question.get(question.id) or []

        # I think we still need to include Resolved questions in the calculations
        # Using their resolution as value for upper/lower bounds
        if question.status == QuestionStatus.RESOLVED:
            value = _value_from_resolved_question(question)
            if value is None:
                continue

            weight_sum += abs(weight)
            contrib = (2 * value - 1) * weight
            lower_sum += contrib
            upper_sum += contrib
        elif agg := get_last_forecast_in_the_past(history, at_time=now):
            weight_sum += abs(weight)
            lower_sum += (
                2 * _value_from_bounds(agg.interval_lower_bounds) - 1
            ) * weight
            upper_sum += (
                2 * _value_from_bounds(agg.interval_upper_bounds) - 1
            ) * weight

    if not weight_sum:
        return 0.5, 0.5

    # Negative weights can invert bounds; sort to enforce (low, high).
    return tuple(
        sorted(
            (
                index_min
                + (index_max - index_min) * ((lower_sum / weight_sum + 1) / 2),
                index_min
                + (index_max - index_min) * ((upper_sum / weight_sum + 1) / 2),
            )
        )
    )


def _get_index_data(
    question_indexes_map: dict[Question, float],
    forecasts_by_question: QuestionsAggMap,
    index_min: float,
    index_max: float,
):
    resolved_questions = [
        q for q in question_indexes_map.keys() if q.status == QuestionStatus.RESOLVED
    ]

    all_resolved = len(resolved_questions) and len(resolved_questions) == len(
        question_indexes_map
    )

    # Generate timeline
    timeline = calculate_questions_index_timeline(
        question_indexes_map,
        forecasts_by_question,
        index_min=index_min,
        index_max=index_max,
    )
    # Generate lower & upper bound indexes for the current date
    lower_bound_index, upper_bound_index = calculate_questions_index_bounds(
        question_indexes_map,
        forecasts_by_question,
        index_min,
        index_max,
    )

    resolved_at = (
        max(
            [
                q.actual_resolve_time
                for q in resolved_questions
                if q.actual_resolve_time
            ],
            default=None,
        )
        if all_resolved
        else None
    )

    # Resolution value is the last value in timeline if is resolved
    resolution_value = timeline[-1]["y"] if timeline and all_resolved else None

    # Cut timeline after resolution
    if resolved_at:
        cutoff = next(
            (
                i
                for i, point in enumerate(timeline)
                if point["x"] >= resolved_at.timestamp()
            ),
            0,
        )
        # Take slice right before the cutoff date
        timeline = timeline[:cutoff]
        # Manually add resolution date segment
        resolution_point: IndexPoint = {
            "x": int(resolved_at.timestamp()),
            "y": resolution_value,
        }
        timeline.append(resolution_point)

    return {
        "line": timeline,
        "status": QuestionStatus.RESOLVED if all_resolved else QuestionStatus.OPEN,
        "resolved_at": resolved_at,
        "resolution": resolution_value,
        "interval_lower_bounds": lower_bound_index,
        "interval_upper_bounds": upper_bound_index,
    }


def get_default_index_data(index: ProjectIndex) -> dict:
    # TODO: add caching
    post_weights = _get_index_posts_with_weights(index)
    question_weights = {
        q: weight for post, weight in post_weights.items() for q in post.questions.all()
    }

    return {
        "series": _get_index_data(
            question_weights,
            _generate_questions_agg_map(question_weights.keys()),
            index_min=index.min,
            index_max=index.max,
        )
    }


def get_multi_year_index_data(index: ProjectIndex) -> dict:
    # TODO: add caching
    post_weights = _get_index_posts_with_weights(index)

    # Get all years
    index_segments: dict[str, dict[Question, float]] = defaultdict(dict)

    for post, weight in post_weights.items():
        for question in post.questions.all():
            index_segments[question.label][question] = weight

    agg_map = _generate_questions_agg_map(flatten(index_segments.values()))

    # Generating individual indexes for each segment
    series_by_year = {
        segment: _get_index_data(q_map, agg_map, index.min, index.max)
        for segment, q_map in index_segments.items()
    }

    return {
        "years": list(index_segments.keys()),
        "series_by_year": series_by_year,
    }
