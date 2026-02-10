from dataclasses import dataclass
from datetime import datetime, timedelta

import numpy as np
from django.db.models import QuerySet, Sum, Q, F
from django.utils import timezone
from scipy.stats import binom

from comments.models import Comment
from posts.models import Post
from questions.models import AggregateForecast, Forecast, Question
from questions.types import AggregationMethod
from scoring.constants import ScoreTypes
from scoring.models import Score
from users.models import User
from utils.cache import cache_get_or_set


@dataclass(frozen=True)
class QuestionScore:
    """
    Lightweight dataclass representing a Score of a Question
    """

    score: float
    question_id: int
    post_id: int
    question_title: str
    question_resolution: str | None = None
    edited_at: datetime | None = None


def generate_question_scores(qs: QuerySet[Score]):
    # Some old users might have a lot of score
    # So we want to save time on db model serialization and select only values we actually use
    scores_qs = qs.annotate(
        question_title=F("question__title"),
        question_resolution=F("question__resolution"),
        post_id=F("question__post_id"),
    ).values(
        "score",
        "edited_at",
        "question_id",
        "question_title",
        "question_resolution",
        "post_id",
    )
    scores = [QuestionScore(**x) for x in scores_qs]

    return scores


def get_score_scatter_plot_data(
    scores: list[QuestionScore] | None = None,
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
    score_type: ScoreTypes | None = None,
) -> dict:
    """must provide either
    1) scores
    2) either user or aggregation_method and optionally a score_type
    """
    # set up
    if scores is None:
        if (user is None and aggregation_method is None) or (
            user is not None and aggregation_method is not None
        ):
            raise ValueError("Either user or aggregation_method must be provided only")
        if user is not None and score_type is None:
            score_type = ScoreTypes.PEER
        if aggregation_method is not None and score_type is None:
            score_type = ScoreTypes.BASELINE
        public_questions = Question.objects.filter_public()
        # TODO: support archived scores
        score_qs = Score.objects.filter(
            question__in=public_questions,
            score_type=score_type,
        )
        if user is not None:
            score_qs = score_qs.filter(user=user)
        else:
            score_qs = score_qs.filter(aggregation_method=aggregation_method)
        scores = list(score_qs)

    scores = sorted(scores, key=lambda s: s.edited_at)
    score_scatter_plot = []
    for score in scores:
        score_scatter_plot.append(
            {
                "score": score.score,
                "score_timestamp": score.edited_at.timestamp(),
                "question_title": score.question_title,
                "post_id": score.post_id,
                "question_resolution": score.question_resolution,
            }
        )

    return {
        "score_scatter_plot": score_scatter_plot,
    }


def get_score_histogram_data(
    scores: list[QuestionScore] | None = None,
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
    score_type: ScoreTypes | None = None,
) -> dict:
    """must provide either
    1) scores
    2) either user or aggregation_method and optionally a score_type
    """
    # set up
    if scores is None:
        if (user is None and aggregation_method is None) or (
            user is not None and aggregation_method is not None
        ):
            raise ValueError("Either user or aggregation_method must be provided only")
        if user is not None and score_type is None:
            score_type = ScoreTypes.PEER
        if aggregation_method is not None and score_type is None:
            score_type = ScoreTypes.BASELINE
        public_questions = Question.objects.filter_public()
        # TODO: support archived scores
        score_qs = Score.objects.filter(
            question__in=public_questions,
            score_type=score_type,
        )
        if user is not None:
            score_qs = score_qs.filter(user=user)
        else:
            score_qs = score_qs.filter(aggregation_method=aggregation_method)
        scores = list(score_qs)

    score_histogram = []
    if len(scores) > 0:
        min_bin = min(-50, min(s.score for s in scores))
        max_bin = max(50, max(s.score for s in scores))
        bin_incr = int((max_bin + np.abs(min_bin)) / 20)
        for bin_start in range(int(np.ceil(min_bin)), int(np.ceil(max_bin)), bin_incr):
            bin_end = bin_start + bin_incr
            score_histogram.append(
                {
                    "bin_start": bin_start,
                    "bin_end": bin_end,
                    "score_count": len(
                        [
                            s.score
                            for s in scores
                            if s.score >= bin_start and s.score < bin_end
                        ]
                    ),
                }
            )

    return {
        "score_histogram": score_histogram,
    }


def get_calibration_curve_data(
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
    chunk_size: int | None = None,
) -> dict:
    if (user is None and aggregation_method is None) or (
        user is not None and aggregation_method is not None
    ):
        raise ValueError("Either user or aggregation_method must be provided only")

    five_years_ago = timezone.now() - timedelta(days=365 * 5)
    public_questions_in_past = Question.objects.filter_public().filter(
        actual_resolve_time__gte=five_years_ago,
    )

    if user is not None:
        forecasts = Forecast.objects.filter(
            post__default_project__default_permission__isnull=False,
            question__actual_resolve_time__gte=five_years_ago,
            question__type="binary",
            question__resolution__in=["no", "yes"],
            question__scheduled_resolve_time__lt=timezone.now(),
            author=user,
        )
    else:
        # TODO: index as well
        forecasts = AggregateForecast.objects.filter(
            question__in=public_questions_in_past,
            question__type="binary",
            question__resolution__in=["no", "yes"],
            # Removes questions that have resolved before close time, which have a bias toward 'yes' resolutions
            question__scheduled_resolve_time__lt=timezone.now(),
            question__include_bots_in_aggregates=False,
            method=aggregation_method,
        ).defer(
            "histogram",
            "interval_lower_bounds",
            "centers",
            "interval_upper_bounds",
            "means",
        )

    # Annotate questions instead of separate fetch
    forecasts = forecasts.annotate(
        question_open_time=F("question__open_time"),
        question_actual_close_time=F("question__actual_close_time"),
        question_resolution=F("question__resolution"),
    )

    if chunk_size is not None:
        forecasts = forecasts.iterator(chunk_size=chunk_size)

    values = []
    weights = []
    resolutions = []

    for forecast in forecasts:
        forecast_horizon_start = forecast.question_open_time.timestamp()
        actual_close_time = forecast.question_actual_close_time.timestamp()
        # The following is a hack to more closely replicate the old site's behavior
        # forecast_horizon_end = question.scheduled_close_time.timestamp()
        forecast_horizon_end = actual_close_time
        forecast_start = max(forecast_horizon_start, forecast.start_time.timestamp())
        if forecast.end_time:
            forecast_end = min(actual_close_time, forecast.end_time.timestamp())
        else:
            forecast_end = actual_close_time
        forecast_duration = forecast_end - forecast_start
        question_duration = forecast_horizon_end - forecast_horizon_start

        if question_duration == 0:
            continue

        weight = max(0, forecast_duration / question_duration)

        if isinstance(forecast, Forecast):
            values.append(forecast.probability_yes)
        else:
            values.append(forecast.forecast_values[1])

        weights.append(weight)
        resolutions.append(int(forecast.question_resolution == "yes"))

    calibration_curve = []
    small_bin_size = 0.125 / 3
    for p_min, p_max in [
        (0 * small_bin_size, 1 * small_bin_size),
        (1 * small_bin_size, 2 * small_bin_size),
        (2 * small_bin_size, 3 * small_bin_size),
        (0.125, 0.175),
        (0.175, 0.225),
        (0.225, 0.275),
        (0.275, 0.325),
        (0.325, 0.375),
        (0.375, 0.425),
        (0.425, 0.475),
        (0.475, 0.525),
        (0.525, 0.575),
        (0.575, 0.625),
        (0.625, 0.675),
        (0.675, 0.725),
        (0.725, 0.775),
        (0.775, 0.825),
        (0.825, 0.875),
        (0.875 + 0 * small_bin_size, 0.875 + 1 * small_bin_size),
        (0.875 + 1 * small_bin_size, 0.875 + 2 * small_bin_size),
        (0.875 + 2 * small_bin_size, 1.00),
    ]:
        resolutions_for_bucket = []
        weights_for_bucket = []
        bin_center = (p_min + p_max) / 2
        for value, weight, resolution in zip(values, weights, resolutions):
            if p_min <= value < p_max:
                resolutions_for_bucket.append(resolution)
                weights_for_bucket.append(weight)
        count = max(len(resolutions_for_bucket), 1)
        average_resolution = (
            np.average(resolutions_for_bucket, weights=weights_for_bucket)
            if sum(weights_for_bucket) > 0
            else None
        )
        lower_confidence_interval = binom.ppf(0.05, count, p_min) / count
        perfect_calibration = binom.ppf(0.50, count, bin_center) / count
        upper_confidence_interval = binom.ppf(0.95, count, p_max) / count

        calibration_curve.append(
            {
                "bin_lower": p_min,
                "bin_upper": p_max,
                "lower_confidence_interval": lower_confidence_interval,
                "average_resolution": average_resolution,
                "upper_confidence_interval": upper_confidence_interval,
                "perfect_calibration": perfect_calibration,
            }
        )

    return {
        "calibration_curve": calibration_curve,
    }


def get_forecasting_stats_data(
    scores: list[QuestionScore] | None = None,
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
    score_type: ScoreTypes | None = None,
) -> dict:
    # set up
    if (user is None and aggregation_method is None) or (
        user is not None and aggregation_method is not None
    ):
        raise ValueError("Either user or aggregation_method must be provided only")
    if user is not None and score_type is None:
        score_type = ScoreTypes.PEER
    if aggregation_method is not None and score_type is None:
        score_type = ScoreTypes.BASELINE
    public_questions = Question.objects.filter_public()
    if scores is None:
        # TODO: support archived scores
        score_qs = Score.objects.filter(
            question__in=public_questions,
            score_type=score_type,
        )
        if user is not None:
            score_qs = score_qs.filter(user=user)
        else:
            score_qs = score_qs.filter(aggregation_method=aggregation_method)
        scores = list(score_qs)

    average_score = (
        None if not scores else np.average([score.score for score in scores])
    )
    forecasts = Forecast.objects.filter(
        post__default_project__default_permission__isnull=False
    )
    if user is not None:
        forecasts = forecasts.filter(author=user)
    forecasts_count = forecasts.count()
    questions_predicted_count = forecasts.values("question").distinct().count()
    score_count = len(scores)

    return {
        "average_score": average_score,
        "forecasts_count": forecasts_count,
        "questions_predicted_count": questions_predicted_count,
        "score_count": score_count,
    }


def get_authoring_stats_data(
    user: User,
) -> dict:
    posts_authored = Post.objects.filter_public().filter(
        Q(author=user) | Q(coauthors=user),
        notebook__isnull=True,
        curation_status=Post.CurationStatus.APPROVED,
    )

    # Each post has a cached `Post.forecasts_count` value.
    # Summing up this field is significantly faster than counting rows in the Forecasts table
    forecasts_on_authored_questions_count = (
        posts_authored.aggregate(total_forecasts=Sum("forecasts_count"))[
            "total_forecasts"
        ]
        or 0
    )

    notebooks_authored_count = (
        Post.objects.filter_public()
        .filter(
            author=user,
            notebook__isnull=False,
            curation_status=Post.CurationStatus.APPROVED,
        )
        .count()
    )
    comment_count = Comment.objects.filter(
        author=user, on_post__in=Post.objects.filter_public(), is_private=False
    ).count()

    return {
        "posts_authored_count": posts_authored.count(),
        "forecasts_on_authored_questions_count": forecasts_on_authored_questions_count,
        "notebooks_authored_count": notebooks_authored_count,
        "comments_count": comment_count,
    }


def _serialize_user_stats(user: User):
    score_qs = Score.objects.filter(
        question__post__default_project__default_permission__isnull=False,
        score_type=ScoreTypes.PEER,
    )
    score_qs = score_qs.filter(user=user)

    scores = generate_question_scores(score_qs)
    data = {}

    data.update(get_score_scatter_plot_data(scores=scores, user=user))
    data.update(get_score_histogram_data(scores=scores, user=user))
    data.update(get_calibration_curve_data(user=user))
    data.update(get_forecasting_stats_data(scores=scores, user=user))
    data.update(get_authoring_stats_data(user))

    return data


def serialize_user_stats(user: User):
    return cache_get_or_set(
        f"serialize_user_stats:{user.id}",
        lambda: _serialize_user_stats(user),
        # 1h
        timeout=3600,
    )
