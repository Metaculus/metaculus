from __future__ import annotations

from typing import Iterable, TypedDict

from django.utils import timezone

from posts.models import Post
from projects.models import Project, ProjectIndexQuestion
from questions.models import AggregateForecast, Question
from questions.utils import get_last_forecast_in_the_past
from utils.dtypes import generate_map_from_list
from utils.the_math.aggregations import minimize_history

IndexPoint = TypedDict("IndexPoint", {"x": int, "y": float})


def _get_index_questions_with_weights(project: Project) -> list[tuple[Question, float]]:
    """
    Returns list of (question, weight) pairs for project's index.
    Excludes zero-weight entries.
    """

    q_objs: Iterable[ProjectIndexQuestion] = (
        # TODO: normalize filters
        project.index_questions.filter(
            question__related_posts__post__curation_status=Post.CurationStatus.APPROVED
        )
        .select_related("question")
        .order_by("question_id")
        .all()
    )
    return [
        (obj.question, float(obj.weight))
        for obj in q_objs
        # TODO: do we need this condition?
        if obj.weight is not None and float(obj.weight) != 0.0
    ]


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


def calculate_project_index_timeline(
    project: Project, max_points: int = 400
) -> list[IndexPoint] | None:
    """
    Build a minimized timeline of the project's index.

    Returns a dict with keys:
      - line: List[IndexPoint as dict]
      - timestamps: List[int] (unix seconds)
    where y values are scaled to [-100, 100].

    # TODO: exclude unsuccessfully resolved/closed questions
    """

    pairs = _get_index_questions_with_weights(project)
    if not pairs:
        return

    questions = [q for q, _ in pairs]

    # TODO: don't take in the future!

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
    all_datetimes = [agg.start_time for agg in aggregate_forecasts]

    # TODO: probably include dates of actual resolution/closure if needed!
    # TODO: and then, add sorting!

    if not all_datetimes:
        return

    # Down-sample timeline
    sampled_datetimes = minimize_history(all_datetimes, max_size=max_points)

    # Always include "now"
    now_dt = timezone.now()
    if not sampled_datetimes or sampled_datetimes[-1] < now_dt:
        sampled_datetimes.append(now_dt)

    line: list[IndexPoint] = []

    for dt in sampled_datetimes:
        ts = dt.timestamp()

        # Some questions might not have forecasts for the given period
        # So we should not include their weights to the denominator
        # So we need to calculate weight_sum individually for each iteration
        weight_sum = 0.0
        score_sum = 0.0

        for question, weight in pairs:
            history = forecasts_by_question.get(question.id)

            if not history:
                continue

            # TODO: WE SHOULD NOT TAKE or history[-1]! (+ exclude its weight)
            #   BUT only if question has not started before the timeline
            #   hmm, so it's probably okay to keep it None then
            # TODO: this one is not very optimized, so I'd propose a different solution for loop!
            agg = get_last_forecast_in_the_past(history, at_time=dt)

            if not agg:
                continue

            # TODO: what should we do with resolved + closed questions?

            weight_sum += abs(weight)
            score_sum += weight * _value_from_forecast(question, agg)

        if weight_sum != 0:
            # Normalize and scale to [-100, 100]
            y_norm = score_sum / weight_sum
            line.append({"x": int(ts), "y": y_norm * 100})

    return line


def get_project_index_payload(project: Project) -> dict:
    """
    Convenience utility to compute both current index values and timeline.
    Returns dict suitable for attaching to API response bodies later.
    """

    timeline = calculate_project_index_timeline(project)
    return {
        # TODO: why?
        # "index": 100.0 * index_now,
        "index": timeline[-1]["y"] if timeline else None,
        "index_timeline": timeline,
    }
