import pytest
import numpy as np

from datetime import datetime, timedelta

from questions.models import Forecast, Question
from scoring.score_math import (
    AggregationEntry,
    ForecastScore,
    get_geometric_means,
    evaluate_forecasts_baseline_accuracy,
    evaluate_forecasts_baseline_spot_forecast,
    evaluate_forecasts_legacy_relative,
    evaluate_forecasts_peer_accuracy,
    evaluate_forecasts_peer_spot_forecast,
)


def dt(d=None):
    # Create a datetime object from days after 2020-01-01
    # d: days after 2020-01-01
    return datetime(2020, 1, 1) + timedelta(days=d or 0)


def dts(d=None):
    # Create a timestamp from days after 2020-01-01
    # d: days after 2020-01-01
    return dt(d).timestamp()


def f(q=None, v=None, s=None, e=None):
    # Create a Forecast object with basic values
    # q: Question Type
    # v: forecast values
    # s: start time (days after 2020-01-01)
    # e: end time (days after 2020-01-01)
    forecast = Forecast(
        start_time=dt(s),
        end_time=None if e is None else dt(e),
    )
    qt = q or Question.QuestionType.BINARY
    if qt == Question.QuestionType.BINARY:
        forecast.probability_yes = v or 0.5
    elif qt == Question.QuestionType.MULTIPLE_CHOICE:
        forecast.probability_yes_per_category = v or [0.2, 0.3, 0.5]
    else:
        forecast.continuous_cdf = v or list(np.linspace(0, 1, 201))
    return forecast


def a(p: list[float] | None = None, n: int = 0, t: int | None = None):
    # Create an AggregationEntry object with basic values
    # p: pmf
    # n: number of forecasters
    # t: time (days after 2020-01-01)
    return AggregationEntry(
        pmf=p or [0.5, 0.5],
        num_forecasters=n,
        timestamp=dts(t),
    )


def s(v=None, c=None):
    # Create a ForecastScore object with basic values
    # v: score value
    # c: coverage
    return ForecastScore(
        score=v or 0,
        coverage=c if c is not None else 1,
    )


class TestScoreMath:

    @pytest.mark.parametrize(
        "forecasts, expected",
        [
            # Trivial
            ([], []),
            ([f()], [a()]),
            # number of forecasters
            ([f()] * 2, [a(n=2)]),
            ([f()] * 100, [a(n=100)]),
            # maths
            ([f(v=0.7), f(v=0.8), f(v=0.9)], [a(p=[0.18171206, 0.79581144], n=3)]),
            # start times
            ([f(), f(s=1)], [a(), a(t=1, n=2)]),
            ([f(), f(s=1), f(s=2)], [a(), a(t=1, n=2), a(t=2, n=3)]),
            ([f(), f(), f(s=1)], [a(n=2), a(t=1, n=3)]),
            # end times
            ([f(), f(e=1)], [a(n=2), a(t=1, n=0)]),
            ([f(), f(s=1, e=2)], [a(), a(t=1, n=2), a(t=2)]),
            # numeric
            (
                [
                    f(q=Question.QuestionType.NUMERIC),
                    f(q=Question.QuestionType.NUMERIC),
                ],
                [a(p=[0] + [1 / 200] * 200 + [0], n=2)],
            ),
            (
                [
                    f(q=Question.QuestionType.NUMERIC, v=[0.2, 0.5, 0.8]),
                    f(q=Question.QuestionType.NUMERIC, v=[0.4, 0.6, 0.8]),
                    f(q=Question.QuestionType.NUMERIC, v=[0.6, 0.7, 0.8]),
                ],
                [a(p=[0.36342412, 0.18171206, 0.18171206, 0.2], n=3)],
            ),
        ],
    )
    def test_get_geometric_means(
        self, forecasts: list[Forecast], expected: list[AggregationEntry]
    ):
        result = get_geometric_means(forecasts)
        assert len(result) == len(expected)
        for ra, ea in zip(result, expected):
            assert all(round(r, 8) == round(e, 8) for r, e in zip(ra.pmf, ea.pmf))
            assert ra.num_forecasters == ea.num_forecasters
            assert ra.timestamp == ea.timestamp

    @pytest.mark.parametrize(
        "forecasts, args,  expected",
        [
            # Trivial
            ([], {}, []),
            ([f()], {}, [s()]),
            ([f()] * 100, {}, [s()] * 100),
            # coverage
            ([f(s=3)], {}, [s(c=0.7)]),
            ([f(s=5)], {}, [s(c=0.5)]),
            ([f(s=7)], {}, [s(c=0.3)]),
            ([f(s=1), f(s=7)], {}, [s(c=0.9), s(c=0.3)]),
            ([f(e=3)], {}, [s(c=0.3)]),
            ([f(s=5, e=8)], {}, [s(c=0.3)]),
            # early resolver
            ([f()], {"actual_close_time": dts(5)}, [s(c=0.5)]),
            ([f(s=5)], {"actual_close_time": dts(5)}, [s(c=0)]),  # forecasted too late
            # maths
            ([f(v=0.9)], {}, [s(v=84.79969066)]),
            ([f(v=0.1)], {}, [s(v=-232.19280949)]),
            ([f(v=0.9)], {"resolution_bucket": 0}, [s(v=-232.19280949)]),
            ([f(v=0.9, s=5)], {}, [s(v=84.79969066 / 2, c=0.5)]),  # half coverage
            ([f(v=2 ** (-1 / 2))], {}, [s(v=50)]),
            ([f(v=2 ** (-3 / 2))], {}, [s(v=-50)]),
            # TODO: numeric
        ],
    )
    def test_evaluate_forecasts_baseline_accuracy(self, forecasts, args, expected):
        args = {
            "forecasts": forecasts,
            "resolution_bucket": 1,
            "forecast_horizon_start": dts(),
            "actual_close_time": dts(10),
            "forecast_horizon_end": dts(10),
            "question_type": Question.QuestionType.BINARY,
            "open_bounds_count": 0,
        } | args
        result = evaluate_forecasts_baseline_accuracy(**args)
        assert len(result) == len(expected)
        for rs, es in zip(result, expected):
            assert round(rs.score, 8) == round(es.score, 8)
            assert round(rs.coverage, 8) == round(es.coverage, 8)
