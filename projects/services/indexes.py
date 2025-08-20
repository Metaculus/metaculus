from typing import Iterable, TypedDict

from django.utils import timezone

from posts.models import Post
from projects.models import Project, ProjectIndexQuestion
from questions.constants import UnsuccessfulResolutionType
from questions.models import AggregateForecast, Question
from questions.utils import get_last_forecast_in_the_past
from utils.dtypes import generate_map_from_list
from utils.the_math.aggregations import minimize_history

IndexPoint = TypedDict("IndexPoint", {"x": int, "y": float})

# TODO: add caching
# TODO: ensure we don't make N+1 queries


def _get_index_questions_with_weights(project: Project) -> list[tuple[Question, float]]:
    """
    Returns list of (question, weight) pairs for project's index.
    Excludes zero-weight entries.
    """

    q_objs: Iterable[ProjectIndexQuestion] = (
        # TODO: make a small refactoring of this!
        project.index_questions.filter(
            question__related_posts__post__curation_status=Post.CurationStatus.APPROVED
        )
        .select_related("question")
        .order_by("question_id")
        .all()
    )
    return [(obj.question, float(obj.weight)) for obj in q_objs]


def _value_from_forecast(question: Question, forecast: AggregateForecast) -> float:
    """
    Convert a single question's AggregateForecast into a normalized index contribution.

    Returns a value in [-1, 1]. Later we scale to [-100, 100] for presentation.
    Mapping rules:
      - Binary: use probability of "yes" (centers[1]) mapped to [-1, 1] via (2p - 1)
      - Numeric/Date/Discrete: use mean survival mass = average(1 - CDF)
    If necessary data is missing, returns 0.
    """

    if question.type == Question.QuestionType.BINARY:
        centers = forecast.centers or []
        if len(centers) >= 2 and centers[1] is not None:
            p_yes = float(centers[1])
            return 2.0 * p_yes - 1.0
        return 0.0

    # Continuous-like (numeric/date/discrete)
    cdf = forecast.forecast_values or []
    if not cdf:
        return 0.0

    # average survival mass in [0, 1]
    # We use this formula instead of the original
    # According to this ticket - https://github.com/Metaculus/metaculus/issues/2471
    return sum((1.0 - float(v)) for v in cdf) / float(len(cdf))


def _value_from_resolved_question(question: Question) -> float | None:
    """
    Generating index value from resolved question.
    """

    if not question.resolution or question.resolution in UnsuccessfulResolutionType:
        return

    if question.type == Question.QuestionType.BINARY:
        return 1 if question.resolution == "yes" else -1

    # TODO: implement for Continuous questions!
    return 0


def calculate_project_index_timeline(
    project: Project, max_points: int = 400
) -> list[IndexPoint]:
    """
    Build a minimized timeline of the project's index.

    Returns a dict with keys:
      - line: List[IndexPoint as dict]
      - timestamps: List[int] (unix seconds)
    where y values are scaled to [-100, 100].
    """

    pairs = _get_index_questions_with_weights(project)
    if not pairs:
        return []

    questions = [q for q, _ in pairs]

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

        for question, weight in pairs:
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


def get_project_index_payload(project: Project) -> dict:
    """
    Convenience utility to compute both current index values and timeline.
    Returns dict suitable for attaching to API response bodies later.
    """

    timeline = calculate_project_index_timeline(project)
    return {
        "index": timeline[-1]["y"] if timeline else None,
        "index_timeline": timeline,
    }
