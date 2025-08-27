from typing import TypedDict

from django.utils import timezone

from posts.models import Post
from projects.models import Project
from questions.constants import QuestionStatus
from questions.models import AggregateForecast, Question
from questions.utils import get_last_forecast_in_the_past
from utils.dtypes import generate_map_from_list
from utils.the_math.aggregations import minimize_history
from utils.the_math.formulas import string_location_to_unscaled_location

IndexPoint = TypedDict("IndexPoint", {"x": int, "y": float})


def _get_index_questions_with_weights(project: Project) -> dict[Question, float]:
    """
    Returns list of (question, weight) pairs for project's index
    """

    q_objs = (
        project.index_questions.filter(
            # TODO: improve this (maybe filter by active posts)
            question__related_posts__post__curation_status=Post.CurationStatus.APPROVED
        )
        .select_related("question")
        .order_by("question_id")
        .all()
    )

    return {obj.question: obj.weight for obj in q_objs}


def _value_from_forecast(question: Question, forecast: AggregateForecast) -> float:
    """
    Convert a single question's AggregateForecast into a normalized index contribution.

    Returns a value in [-1, 1]. Later we scale to [-100, 100] for presentation.
    Mapping rules:
      - Binary: use probability of "yes" (centers[1]) mapped to [-1, 1] via (2p - 1)
      - Numeric/Date/Discrete: use mean survival mass = average(1 - 2*CDF)
    If necessary data is missing, returns 0.
    """

    if question.type == Question.QuestionType.BINARY:
        centers = forecast.centers or []
        if len(centers) >= 2 and centers[1] is not None:
            p_yes = float(centers[1])
            return 2.0 * p_yes - 1.0
        return 0.0

    # Continuous
    cdf = forecast.forecast_values or []
    if not cdf:
        return 0.0

    # We use this formula instead of the original
    # According to this ticket - https://github.com/Metaculus/metaculus/issues/2471
    return 1.0 - 2.0 * (sum(cdf) / len(cdf))


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

    # For binary, this will always be -1 or 1
    return 2 * unscaled_resolution - 1


def calculate_questions_index_timeline(
    question_indexes_map: dict[Question, float], max_points: int = 400
) -> list[IndexPoint]:
    """
    Build a minimized timeline of the project's index.

    Returns a dict with keys:
      - line: List[IndexPoint as dict]
      - timestamps: List[int] (unix seconds)
    where y values are scaled to [-100, 100].
    """

    questions = question_indexes_map.keys()

    aggregate_forecasts = (
        AggregateForecast.objects.filter_default_aggregation()
        .filter(question__in=questions)
        .filter(start_time__lte=timezone.now())
        .only("question_id", "forecast_values", "start_time", "end_time", "centers")
        .order_by("start_time")
    )
    forecasts_by_question = generate_map_from_list(
        aggregate_forecasts,
        lambda agg: agg.question_id,
    )
    all_datetimes = list(
        {agg.start_time for agg in aggregate_forecasts}
        # Append actual resolution dates when accurate
        | {q.actual_resolve_time for q in questions if q.actual_resolve_time}
        # Append actual close dates when accurate
        | {q.actual_close_time for q in questions if q.actual_close_time}
        # Always include now
        | {timezone.now()}
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

            if not history:
                continue

            value = None

            # Handle resolved questions index
            if question.actual_resolve_time and dt >= question.actual_resolve_time:
                value = _value_from_resolved_question(question)
            else:
                # TODO: this one is not very optimized, so need to propose different solution for loop!
                if agg := get_last_forecast_in_the_past(history, at_time=dt):
                    value = _value_from_forecast(question, agg)

            if value is not None:
                weight_sum += abs(weight)
                score_sum += weight * value

        # Normalize and scale to [-100, 100]
        y = score_sum / weight_sum if weight_sum != 0 else 0
        line.append({"x": int(dt.timestamp()), "y": y * 100})

    return line


def _get_index_data(question_indexes_map: dict[Question, float]):
    resolved_questions = [
        q for q in question_indexes_map.keys() if q.status == QuestionStatus.RESOLVED
    ]

    all_resolved = len(resolved_questions) == len(question_indexes_map)
    timeline = calculate_questions_index_timeline(question_indexes_map)
    # Resolution value is the last value in timeline if is resolved
    resolution_value = timeline[-1]["y"] if timeline and all_resolved else None

    return {
        "line": timeline,
        "status": QuestionStatus.RESOLVED if all_resolved else QuestionStatus.OPEN,
        "resolved_at": (
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
        ),
        "resolution": resolution_value,
    }


def get_project_single_index_data(project: Project) -> dict:
    # TODO: add caching
    question_weights = _get_index_questions_with_weights(project)

    return _get_index_data(question_weights)
