from datetime import datetime, timezone as dt_timezone

import numpy as np
import pytest

from questions.models import Forecast, Question
from questions.types import AggregationMethod
from scoring.constants import ScoreTypes
from scoring.score_math import (
    evaluate_forecasts_baseline_accuracy,
    evaluate_forecasts_baseline_spot_forecast,
    evaluate_forecasts_legacy_relative,
    evaluate_forecasts_peer_accuracy,
    evaluate_forecasts_peer_spot_forecast,
    evaluate_question,
    get_geometric_means,
    get_resolution_range,
)
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question
from tests.unit.utils import datetime_aware
from users.models import User

OPEN = datetime_aware(2025, 1, 1)
CLOSE = datetime_aware(2026, 1, 1)


def numeric_question(range_min, range_max, lower, upper, **kwargs) -> Question:
    return Question(
        type=Question.QuestionType.NUMERIC,
        range_min=range_min,
        range_max=range_max,
        open_lower_bound=False,
        open_upper_bound=False,
        inbound_outcome_count=3,
        resolution_lower_bound=lower,
        resolution_upper_bound=upper,
        **kwargs,
    )


def forecast(cdf, start=OPEN, end=None, author_id=1) -> Forecast:
    return Forecast(
        continuous_cdf=cdf, start_time=start, end_time=end, author_id=author_id
    )


class TestGetResolutionRange:
    def test_no_bounds(self):
        assert get_resolution_range(numeric_question(0, 3, None, None)) is None

    def test_interval_equal_to_a_bucket(self):
        resolution_range = get_resolution_range(
            numeric_question(-0.5, 2.5, "0.5", "1.5")
        )
        np.testing.assert_allclose(resolution_range.weights, [0, 0, 1, 0, 0])
        assert resolution_range.width == pytest.approx(1 / 3)

    def test_interval_spanning_buckets(self):
        resolution_range = get_resolution_range(numeric_question(0, 3, "0.5", "1.5"))
        np.testing.assert_allclose(resolution_range.weights, [0, 0.5, 0.5, 0, 0])
        assert resolution_range.width == pytest.approx(1 / 3)

    def test_bounds_on_the_range_ends(self):
        resolution_range = get_resolution_range(numeric_question(0, 3, "0", "3"))
        np.testing.assert_allclose(resolution_range.weights, [0, 1, 1, 1, 0])
        assert resolution_range.width == pytest.approx(1)

    def test_bounds_on_the_range_ends_of_a_log_question(self):
        question = numeric_question(1, 1000, "1", "1000", zero_point=0)
        resolution_range = get_resolution_range(question)
        np.testing.assert_allclose(resolution_range.weights, [0, 1, 1, 1, 0])
        assert resolution_range.width == pytest.approx(1)

    @pytest.mark.parametrize(
        "lower, upper, open_bounds",
        [
            ("-0.5", "0.5", False),  # below the range
            ("2.5", "3.5", False),  # above the range
            ("-5", "5", True),  # open bounds don't widen the allowed range
            ("4", "5", False),  # no overlap at all
            ("2", "1", False),  # inverted
            ("1", "1", False),  # zero width
            ("nan", "1", False),
            ("1", None, False),  # only one bound
        ],
    )
    def test_invalid_bounds_raise(self, lower, upper, open_bounds):
        question = numeric_question(0, 3, lower, upper)
        question.open_lower_bound = question.open_upper_bound = open_bounds
        with pytest.raises(ValueError):
            get_resolution_range(question)

    def test_below_a_log_range_raises_instead_of_nan(self):
        with pytest.raises(ValueError):
            get_resolution_range(numeric_question(1, 1000, "-0.5", "10", zero_point=0))

    def test_date_question(self):
        question = Question(
            type=Question.QuestionType.DATE,
            range_min=datetime(2026, 1, 1, tzinfo=dt_timezone.utc).timestamp(),
            range_max=datetime(2026, 1, 4, tzinfo=dt_timezone.utc).timestamp(),
            open_lower_bound=False,
            open_upper_bound=False,
            inbound_outcome_count=3,
            resolution_lower_bound="2026-01-02 00:00:00+00:00",
            resolution_upper_bound="2026-01-03 00:00:00+00:00",
        )
        resolution_range = get_resolution_range(question)
        np.testing.assert_allclose(resolution_range.weights, [0, 0, 1, 0, 0])


class TestRangeMatchesBucketScoring:
    """A range covering exactly one bucket scores the same as that bucket"""

    question = numeric_question(-0.5, 2.5, "0.5", "1.5")
    bucket = 2
    forecasts = [
        forecast([0.0, 0.2, 0.7, 1.0], author_id=1),
        forecast([0.0, 0.5, 0.6, 1.0], start=datetime_aware(2025, 6, 1), author_id=2),
    ]
    spot = datetime_aware(2025, 9, 1).timestamp()

    @pytest.fixture
    def resolution_range(self):
        return get_resolution_range(self.question)

    def test_baseline(self, resolution_range):
        args = (self.forecasts, self.bucket, OPEN.timestamp(), CLOSE.timestamp())
        expected = evaluate_forecasts_baseline_accuracy(
            *args, CLOSE.timestamp(), "numeric", 0
        )
        result = evaluate_forecasts_baseline_accuracy(
            *args, CLOSE.timestamp(), "numeric", 0, resolution_range=resolution_range
        )
        assert [s.score for s in result] == pytest.approx([s.score for s in expected])

    def test_spot_baseline(self, resolution_range):
        args = (self.forecasts, self.bucket, self.spot, "numeric", 0)
        expected = evaluate_forecasts_baseline_spot_forecast(*args)
        result = evaluate_forecasts_baseline_spot_forecast(
            *args, resolution_range=resolution_range
        )
        assert [s.score for s in result] == pytest.approx([s.score for s in expected])

    def test_peer(self, resolution_range):
        args = (
            self.forecasts,
            None,
            self.bucket,
            OPEN.timestamp(),
            CLOSE.timestamp(),
            CLOSE.timestamp(),
            "numeric",
        )
        expected = evaluate_forecasts_peer_accuracy(*args)
        result = evaluate_forecasts_peer_accuracy(
            *args, resolution_range=resolution_range
        )
        assert [s.score for s in result] == pytest.approx([s.score for s in expected])
        assert [s.coverage for s in result] == pytest.approx(
            [s.coverage for s in expected]
        )

    def test_spot_peer(self, resolution_range):
        args = (self.forecasts, None, self.bucket, self.spot, "numeric")
        expected = evaluate_forecasts_peer_spot_forecast(*args)
        result = evaluate_forecasts_peer_spot_forecast(
            *args, resolution_range=resolution_range
        )
        assert [s.score for s in result] == pytest.approx([s.score for s in expected])

    def test_legacy_relative(self, resolution_range):
        args = (
            self.forecasts,
            self.forecasts,
            self.bucket,
            OPEN.timestamp(),
            CLOSE.timestamp(),
        )
        for f in self.forecasts:
            f.forecaster_count = 1
        expected = evaluate_forecasts_legacy_relative(*args)
        result = evaluate_forecasts_legacy_relative(
            *args, resolution_range=resolution_range
        )
        assert [s.score for s in result] == pytest.approx([s.score for s in expected])


def test_peer_uses_geometric_mean_of_interval_masses():
    resolution_range = get_resolution_range(numeric_question(0, 3, "0.5", "1.5"))
    forecasts = [
        forecast([0.0, 0.2, 0.7, 1.0], author_id=1),
        forecast([0.0, 0.5, 0.6, 1.0], author_id=2),
    ]
    # interval (0.5, 1.5] is half of bucket 1 and half of bucket 2
    p1 = 0.5 * 0.2 + 0.5 * 0.5
    p2 = 0.5 * 0.5 + 0.5 * 0.1
    gms = get_geometric_means(forecasts, resolution_range)
    assert gms[0].pmf[0] == pytest.approx(np.sqrt(p1 * p2))

    scores = evaluate_forecasts_peer_accuracy(
        forecasts,
        None,
        1,
        OPEN.timestamp(),
        CLOSE.timestamp(),
        CLOSE.timestamp(),
        "numeric",
        resolution_range=resolution_range,
    )
    assert scores[0].score == pytest.approx(100 * 2 * np.log(p1 / np.sqrt(p1 * p2)) / 2)


def test_bucket_counting_forecast_does_not_beat_naive():
    """
    Sawtooth: 4 equally likely integer outcomes in 3 buckets on [-0.5, 3.5], with
    outcomes 1 and 2 in the middle bucket. Weighting buckets by outcome count wins
    under bucket scoring but not under range resolution.
    """
    naive = forecast([0.0, 1 / 3, 2 / 3, 1.0])
    bucket_counting = forecast([0.0, 0.25, 0.75, 1.0])

    def expected_baseline(f: Forecast, use_range: bool) -> float:
        total = 0.0
        for outcome, bucket in zip([0, 1, 2, 3], [1, 2, 2, 3]):
            question = numeric_question(
                -0.5, 3.5, str(outcome - 0.5), str(outcome + 0.5)
            )
            resolution_range = get_resolution_range(question) if use_range else None
            [score] = evaluate_forecasts_baseline_accuracy(
                [f],
                bucket,
                OPEN.timestamp(),
                CLOSE.timestamp(),
                CLOSE.timestamp(),
                "numeric",
                0,
                resolution_range=resolution_range,
            )
            total += score.score / 4
        return total

    assert expected_baseline(naive, False) == pytest.approx(0)
    assert expected_baseline(bucket_counting, False) == pytest.approx(
        50 * (0.5 * np.log(1.5) + 0.5 * np.log(0.75))
    )
    assert expected_baseline(naive, True) == pytest.approx(0)
    assert expected_baseline(bucket_counting, True) < -1


def test_evaluate_question_uses_resolution_bounds():
    question = create_question(
        question_type=Question.QuestionType.NUMERIC,
        range_min=-0.5,
        range_max=2.5,
        open_lower_bound=False,
        open_upper_bound=False,
        inbound_outcome_count=3,
        zero_point=None,
        open_time=OPEN,
        scheduled_close_time=CLOSE,
        actual_close_time=CLOSE,
        resolution="1.0",
    )
    question.post = factory_post(question=question)
    question.save(update_fields=["post"])
    for username, cdf, start in [
        ("user_1", [0.0, 0.2, 0.7, 1.0], OPEN),
        ("user_2", [0.0, 0.5, 0.6, 1.0], datetime_aware(2025, 6, 1)),
    ]:
        author, _ = User.objects.get_or_create(username=username)
        Forecast.objects.create(
            question=question, author=author, continuous_cdf=cdf, start_time=start
        )

    def scores(q: Question) -> dict:
        return {
            (s.user_id, s.aggregation_method, s.score_type): s.score
            for s in evaluate_question(
                q,
                q.resolution,
                score_types=[
                    ScoreTypes.BASELINE,
                    ScoreTypes.PEER,
                    ScoreTypes.SPOT_BASELINE,
                    ScoreTypes.SPOT_PEER,
                    ScoreTypes.RELATIVE_LEGACY,
                ],
                spot_forecast_time=datetime_aware(2025, 9, 1),
                aggregation_methods=[AggregationMethod.RECENCY_WEIGHTED],
            )
        }

    bucket_scores = scores(question)

    # range equal to the resolution's bucket: same scores
    question.resolution_lower_bound = "0.5"
    question.resolution_upper_bound = "1.5"
    range_scores = scores(question)
    assert range_scores.keys() == bucket_scores.keys()
    for key, value in bucket_scores.items():
        assert range_scores[key] == pytest.approx(value), key

    # wider range: different baseline scores
    question.resolution_lower_bound = "0.0"
    question.resolution_upper_bound = "2.0"
    wide_scores = scores(question)
    user_1 = User.objects.get(username="user_1").id
    key = (user_1, None, ScoreTypes.BASELINE)
    assert wide_scores[key] != pytest.approx(bucket_scores[key])
