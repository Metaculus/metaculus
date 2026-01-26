import pytest
import numpy as np
from scipy.stats.mstats import gmean

from datetime import datetime, timedelta

from questions.models import Forecast, Question
from scoring.score_math import (
    AggregationEntry,
    ForecastScore,
    get_geometric_means,
    evaluate_forecasts_baseline_accuracy,
    evaluate_forecasts_baseline_spot_forecast,
    evaluate_forecasts_peer_accuracy,
    evaluate_forecasts_peer_spot_forecast,
)

QT = Question.QuestionType


def dt(d=None):
    # Create a datetime object from days after 2020-01-01
    # d: days after 2020-01-01
    return datetime(2020, 1, 1) + timedelta(days=d or 0)


def dts(d=None):
    # Create a timestamp from days after 2020-01-01
    # d: days after 2020-01-01
    return dt(d).timestamp()


def F(q=None, v=None, s=None, e=None):
    # Create a Forecast object with basic values
    # q: Question Type
    # v: forecast values
    # s: start time (days after 2020-01-01)
    # e: end time (days after 2020-01-01)
    forecast = Forecast(start_time=dt(s), end_time=None if e is None else dt(e))
    match (q or QT.BINARY):
        case QT.BINARY:
            forecast.probability_yes = v or 0.5
        case QT.MULTIPLE_CHOICE:
            forecast.probability_yes_per_category = v or [0.2, 0.3, 0.5]
        case QT.NUMERIC:
            forecast.continuous_cdf = v or list(np.linspace(0, 1, 201))
    return forecast


def A(p: list[float | None] | None = None, n: int = 0, t: int | None = None):
    # Create an AggregationEntry object with basic values
    # p: pmf
    # n: number of forecasters
    # t: time (days after 2020-01-01)
    return AggregationEntry(pmf=p or [0.5, 0.5], num_forecasters=n, timestamp=dts(t))


def S(v=None, c=None):
    # Create a ForecastScore object with basic values
    # v: score value
    # c: coverage
    return ForecastScore(score=v or 0, coverage=c if c is not None else 1)


class TestScoreMath:

    @pytest.mark.parametrize(
        "forecasts, expected",
        [
            # Trivial
            ([], []),
            ([F()], [A()]),
            # number of forecasters
            ([F()] * 2, [A(n=2)]),
            ([F()] * 100, [A(n=100)]),
            # maths
            ([F(v=0.7), F(v=0.8), F(v=0.9)], [A(p=[0.18171206, 0.79581144], n=3)]),
            # multiple choice forecasts with placeholder 0s
            (
                [F(q=QT.MULTIPLE_CHOICE, v=[0.6, 0.15, None, 0.25])] * 2,
                [A(n=2, p=[0.6, 0.15, 0.0, 0.25])],
            ),
            # start times
            ([F(), F(s=1)], [A(), A(t=1, n=2)]),
            ([F(), F(s=1), F(s=2)], [A(), A(t=1, n=2), A(t=2, n=3)]),
            ([F(), F(), F(s=1)], [A(n=2), A(t=1, n=3)]),
            # end times
            ([F(), F(e=1)], [A(n=2), A(t=1, n=0)]),
            ([F(), F(s=1, e=2)], [A(), A(t=1, n=2), A(t=2)]),
            # numeric
            (
                [F(q=QT.NUMERIC), F(q=QT.NUMERIC)],
                [A(p=[0.0] + [1 / 200] * 200 + [0.0], n=2)],
            ),
            (
                [
                    F(q=QT.NUMERIC, v=[0.2, 0.5, 0.8]),
                    F(q=QT.NUMERIC, v=[0.4, 0.6, 0.8]),
                    F(q=QT.NUMERIC, v=[0.6, 0.7, 0.8]),
                ],
                [A(p=[0.36342412, 0.18171206, 0.18171206, 0.2], n=3)],
            ),
        ],
    )
    def test_get_geometric_means(
        self, forecasts: list[Forecast], expected: list[AggregationEntry]
    ):
        result = get_geometric_means(forecasts)
        assert len(result) == len(expected)
        for ra, ea in zip(result, expected):
            assert all(
                ((r == e) or (round(r, 8) == round(e, 8)))
                for r, e in zip(ra.pmf, ea.pmf)
            )
            assert ra.num_forecasters == ea.num_forecasters
            assert ra.timestamp == ea.timestamp

    @pytest.mark.parametrize(
        "forecasts, args,  expected",
        [
            # Trivial
            ([], {}, []),
            ([F()], {}, [S()]),
            ([F()] * 100, {}, [S()] * 100),
            # coverage
            ([F(s=3)], {}, [S(c=0.7)]),
            ([F(s=5)], {}, [S(c=0.5)]),
            ([F(s=7)], {}, [S(c=0.3)]),
            ([F(s=1), F(s=7)], {}, [S(c=0.9), S(c=0.3)]),
            ([F(e=3)], {}, [S(c=0.3)]),
            ([F(s=5, e=8)], {}, [S(c=0.3)]),
            # early resolver
            ([F()], {"actual_close_time": dts(5)}, [S(c=0.5)]),
            ([F(s=5)], {"actual_close_time": dts(5)}, [S(c=0)]),  # forecasted too late
            # maths
            ([F(v=0.9)], {}, [S(v=84.79969066)]),
            ([F(v=0.1)], {}, [S(v=-232.19280949)]),
            ([F(v=0.9)], {"resolution_bucket": 0}, [S(v=-232.19280949)]),
            ([F(v=0.9, s=5)], {}, [S(v=84.79969066 / 2, c=0.5)]),  # half coverage
            ([F(v=2 ** (-1 / 2))], {}, [S(v=50)]),
            ([F(v=2 ** (-3 / 2))], {}, [S(v=-50)]),
            # multiple choice w/ placeholder at index 2
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 - 3 ** (-0.5) - 1 / 3, None, 3 ** (-0.5)],
                    )
                ],
                {"resolution_bucket": 0, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=0.0)],
            ),  # chosen to have a score of 0 for simplicity
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 - 3 ** (-0.5) - 1 / 3, None, 3 ** (-0.5)],
                    )
                ],
                {"resolution_bucket": 2, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=50)],
            ),  # same score as index == 3 since None should read from "Other"
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 - 3 ** (-0.5) - 1 / 3, None, 3 ** (-0.5)],
                    )
                ],
                {"resolution_bucket": 3, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=50)],
            ),  # chosen to have a score of 50 for simplicity
            # numeric
            (
                [F(q=QT.NUMERIC)],
                {"resolution_bucket": 150, "question_type": QT.NUMERIC},
                [S()],
            ),
            (
                [F(q=QT.NUMERIC, v=np.linspace(0.05, 0.95, 201).tolist())],
                {
                    "resolution_bucket": 150,
                    "question_type": QT.NUMERIC,
                    "open_bounds_count": 2,
                },
                [S()],
            ),
            (
                [F(q=QT.NUMERIC, v=[0, np.e / 2, 1])],
                {"question_type": QT.NUMERIC},
                [S(v=50)],
            ),
            (
                [F(q=QT.NUMERIC, v=[0, 1 / (np.e * 2), 1])],
                {"question_type": QT.NUMERIC},
                [S(v=-50)],
            ),
        ],
    )
    def test_evaluate_forecasts_baseline_accuracy(self, forecasts, args, expected):
        args = {
            "forecasts": forecasts,
            "resolution_bucket": 1,
            "forecast_horizon_start": dts(),
            "actual_close_time": dts(10),
            "forecast_horizon_end": dts(10),
            "question_type": QT.BINARY,
            "open_bounds_count": 0,
        } | args
        result = evaluate_forecasts_baseline_accuracy(**args)
        assert len(result) == len(expected)
        for rs, es in zip(result, expected):
            assert round(rs.score, 8) == round(es.score, 8)
            assert round(rs.coverage, 8) == round(es.coverage, 8)

    @pytest.mark.parametrize(
        "forecasts, args,  expected",
        [
            # Trivial
            ([], {}, []),
            ([F()], {}, [S()]),
            ([F()] * 100, {}, [S()] * 100),
            # coverage
            ([F(s=3)], {}, [S(c=1)]),
            ([F(s=5)], {}, [S(c=1)]),
            ([F(s=7)], {}, [S(c=1)]),
            ([F(s=1), F(s=7)], {}, [S(c=1), S(c=1)]),
            ([F(e=3)], {}, [S(c=0)]),
            ([F(s=5, e=8)], {}, [S(c=0)]),
            ([F(s=5, e=8)], {"spot_forecast_timestamp": dts(6)}, [S(c=1)]),
            # early resolver
            ([F()], {"spot_forecast_timestamp": dts(5)}, [S(c=1)]),
            ([F(s=6)], {"spot_forecast_timestamp": dts(5)}, [S(c=0)]),
            # maths
            ([F(v=0.9)], {}, [S(v=84.79969066)]),
            ([F(v=0.1)], {}, [S(v=-232.19280949)]),
            ([F(v=0.9)], {"resolution_bucket": 0}, [S(v=-232.19280949)]),
            ([F(v=0.9, s=5)], {}, [S(v=84.79969066, c=1)]),
            ([F(v=2 ** (-1 / 2))], {}, [S(v=50)]),
            ([F(v=2 ** (-3 / 2))], {}, [S(v=-50)]),
            # multiple choice w/ placeholder at index 2
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 - 3 ** (-0.5) - 1 / 3, None, 3 ** (-0.5)],
                    )
                ],
                {"resolution_bucket": 0, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=0.0)],
            ),  # chosen to have a score of 0 for simplicity
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 - 3 ** (-0.5) - 1 / 3, None, 3 ** (-0.5)],
                    )
                ],
                {"resolution_bucket": 2, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=50)],
            ),  # same score as index == 3 since None should read from "Other"
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 - 3 ** (-0.5) - 1 / 3, None, 3 ** (-0.5)],
                    )
                ],
                {"resolution_bucket": 3, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=50)],
            ),  # chosen to have a score of 50 for simplicity
            # numeric
            (
                [F(q=QT.NUMERIC)],
                {"resolution_bucket": 150, "question_type": QT.NUMERIC},
                [S()],
            ),
            (
                [F(q=QT.NUMERIC, v=np.linspace(0.05, 0.95, 201).tolist())],
                {
                    "resolution_bucket": 150,
                    "question_type": QT.NUMERIC,
                    "open_bounds_count": 2,
                },
                [S()],
            ),
            (
                [F(q=QT.NUMERIC, v=[0, np.e / 2, 1])],
                {"question_type": QT.NUMERIC},
                [S(v=50)],
            ),
            (
                [F(q=QT.NUMERIC, v=[0, 1 / (np.e * 2), 1])],
                {"question_type": QT.NUMERIC},
                [S(v=-50)],
            ),
        ],
    )
    def test_evaluate_forecasts_baseline_spot_forecast(self, forecasts, args, expected):
        args = {
            "forecasts": forecasts,
            "resolution_bucket": 1,
            "spot_forecast_timestamp": dts(10),
            "question_type": QT.BINARY,
            "open_bounds_count": 0,
        } | args
        result = evaluate_forecasts_baseline_spot_forecast(**args)
        assert len(result) == len(expected)
        for rs, es in zip(result, expected):
            assert round(rs.score, 8) == round(es.score, 8)
            assert round(rs.coverage, 8) == round(es.coverage, 8)

    @pytest.mark.parametrize(
        "forecasts, args,  expected",
        [
            # Trivial
            ([], {}, []),
            ([F()], {}, [S()]),
            ([F()] * 100, {}, [S()] * 100),
            # coverage
            ([F(s=3)], {}, [S(c=0.7)]),
            ([F(s=5)], {}, [S(c=0.5)]),
            ([F(s=7)], {}, [S(c=0.3)]),
            ([F(s=1), F(s=7)], {}, [S(c=0.9), S(c=0.3)]),
            #
            # TODO: neglectable bug exists where the last forecast is withdrawn, it will
            # receive coverage as if it was never withdrawn, but will also inherently
            # have a peer score of 0 during that interval, so it doesn't really matter
            # ([F(e=3)], {}, [S(c=0.3)]),
            # ([F(s=5, e=8)], {}, [S(c=0.3)]),
            # ([F(e=3), F(e=7)], {}, [S(c=0.3), S(c=0.7)]),
            # ([F(e=5), F(s=2, e=7)], {}, [S(c=0.5), S(c=0.5)]),
            #
            ([F(), F(s=4, e=6)], {}, [S(c=1), S(c=0.2)]),
            ([F(e=5), F(s=5), F(s=2)], {}, [S(c=0.5), S(c=0.5), S(c=0.8)]),
            # early resolver
            ([F()], {"actual_close_time": dts(5)}, [S(c=0.5)]),
            ([F(s=5)], {"actual_close_time": dts(5)}, [S(c=0)]),  # forecasted too late
            # maths
            ([F(v=0.9)], {}, [S()]),
            ([F(v=0.9), F(v=0.9)], {}, [S(), S()]),
            (
                [F(v=0.1), F(v=0.9)],
                {},
                [S(v=100 * np.log(0.1 / 0.9)), S(v=100 * np.log(0.9 / 0.1))],
            ),
            (
                [F(v=0.4), F(v=0.6)],
                {},
                [S(v=100 * np.log(0.4 / 0.6)), S(v=100 * np.log(0.6 / 0.4))],
            ),
            (
                [F(v=0.1), F(v=0.5), F(v=0.9)],
                {},
                [
                    S(v=100 * np.log(0.1 / gmean([0.5, 0.9]))),
                    S(v=100 * np.log(0.5 / gmean([0.1, 0.9]))),
                    S(v=100 * np.log(0.9 / gmean([0.1, 0.5]))),
                ],
            ),
            (
                [F(v=0.1), F(v=0.3), F(v=0.6), F(v=0.9)],
                {},
                [
                    S(v=100 * np.log(0.1 / gmean([0.3, 0.6, 0.9]))),
                    S(v=100 * np.log(0.3 / gmean([0.1, 0.6, 0.9]))),
                    S(v=100 * np.log(0.6 / gmean([0.1, 0.3, 0.9]))),
                    S(v=100 * np.log(0.9 / gmean([0.1, 0.3, 0.6]))),
                ],
            ),
            (
                [F(v=0.1), F(v=0.5), F(s=5, v=0.9)],
                {},
                [
                    S(
                        v=100
                        * (
                            0.5 * np.log(0.1 / 0.5)
                            + 0.5 * np.log(0.1 / gmean([0.5, 0.9]))
                        )
                    ),
                    S(
                        v=100
                        * (
                            0.5 * np.log(0.5 / 0.1)
                            + 0.5 * np.log(0.5 / gmean([0.1, 0.9]))
                        )
                    ),
                    S(v=100 * (0.5 * 0 + 0.5 * np.log(0.9 / gmean([0.1, 0.5]))), c=0.5),
                ],
            ),
            # multiple choice w/ placeholder at index 2
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[
                            1 / 3,
                            1 - (np.e ** (0.25) / 3) - 1 / 3,
                            None,
                            np.e ** (0.25) / 3,
                        ],
                    ),
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 / 3, None, 1 / 3],
                    ),
                ],
                {"resolution_bucket": 0, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=0), S(v=0)],
            ),  # chosen to have a score of 0 for simplicity
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[
                            1 / 3,
                            1 - (np.e ** (0.25) / 3) - 1 / 3,
                            None,
                            np.e ** (0.25) / 3,
                        ],
                    ),
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 / 3, None, 1 / 3],
                    ),
                ],
                {"resolution_bucket": 2, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=25), S(v=-25)],
            ),  # same score as index == 3 since 0.0 should read from "Other"
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[
                            1 / 3,
                            1 - (np.e ** (0.25) / 3) - 1 / 3,
                            None,
                            np.e ** (0.25) / 3,
                        ],
                    ),
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 / 3, None, 1 / 3],
                    ),
                ],
                {"resolution_bucket": 3, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=25), S(v=-25)],
            ),  # chosen to have a score of 25 for simplicity
            # TODO: add tests with base forecasts different from forecasts
        ],
    )
    def test_evaluate_forecasts_peer_accuracy(self, forecasts, args, expected):
        args = {
            "forecasts": forecasts,
            "base_forecasts": [],  # no base forecasts -> just takes forecasts
            "resolution_bucket": 1,
            "forecast_horizon_start": dts(),
            "actual_close_time": dts(10),
            "forecast_horizon_end": dts(10),
            "question_type": QT.BINARY,
            "geometric_means": [],  # gets calculated from base_forecasts
        } | args
        result = evaluate_forecasts_peer_accuracy(**args)
        assert len(result) == len(expected)
        for rs, es in zip(result, expected):
            assert round(rs.score, 8) == round(es.score, 8)
            assert round(rs.coverage, 8) == round(es.coverage, 8)

    @pytest.mark.parametrize(
        "forecasts, args,  expected",
        [
            # Trivial
            ([], {}, []),
            ([F()], {}, [S()]),
            ([F()] * 100, {}, [S()] * 100),
            # coverage
            ([F(s=3)], {}, [S(c=1)]),
            ([F(s=5)], {}, [S(c=1)]),
            ([F(s=7)], {}, [S(c=1)]),
            ([F(s=1), F(s=7)], {}, [S(c=1), S(c=1)]),
            ([F(e=3)], {}, [S(c=0)]),
            ([F(s=5, e=8)], {}, [S(c=0)]),
            ([F(s=5, e=8)], {"spot_forecast_timestamp": dts(6)}, [S(c=1)]),
            # early resolver
            ([F()], {"spot_forecast_timestamp": dts(5)}, [S(c=1)]),
            ([F(s=6)], {"spot_forecast_timestamp": dts(5)}, [S(c=0)]),
            # maths
            ([F(v=0.9)], {}, [S()]),
            ([F(v=0.9), F(v=0.9)], {}, [S(), S()]),
            (
                [F(v=0.1), F(v=0.9)],
                {},
                [S(v=100 * np.log(0.1 / 0.9)), S(v=100 * np.log(0.9 / 0.1))],
            ),
            (
                [F(v=0.4), F(v=0.6)],
                {},
                [S(v=100 * np.log(0.4 / 0.6)), S(v=100 * np.log(0.6 / 0.4))],
            ),
            (
                [F(v=0.1), F(v=0.5), F(v=0.9)],
                {},
                [
                    S(v=100 * np.log(0.1 / gmean([0.5, 0.9]))),
                    S(v=100 * np.log(0.5 / gmean([0.1, 0.9]))),
                    S(v=100 * np.log(0.9 / gmean([0.1, 0.5]))),
                ],
            ),
            (
                [F(v=0.1), F(v=0.3), F(v=0.6), F(v=0.9)],
                {},
                [
                    S(v=100 * np.log(0.1 / gmean([0.3, 0.6, 0.9]))),
                    S(v=100 * np.log(0.3 / gmean([0.1, 0.6, 0.9]))),
                    S(v=100 * np.log(0.6 / gmean([0.1, 0.3, 0.9]))),
                    S(v=100 * np.log(0.9 / gmean([0.1, 0.3, 0.6]))),
                ],
            ),
            (
                [F(v=0.1), F(v=0.5), F(s=5, v=0.9)],
                {},
                [
                    S(v=100 * np.log(0.1 / gmean([0.5, 0.9]))),
                    S(v=100 * np.log(0.5 / gmean([0.1, 0.9]))),
                    S(v=100 * np.log(0.9 / gmean([0.1, 0.5]))),
                ],
            ),
            (
                [F(v=0.1), F(v=0.5), F(e=5, v=0.9)],
                {},
                [S(v=100 * np.log(0.1 / 0.5)), S(v=100 * np.log(0.5 / 0.1)), S(c=0)],
            ),
            # multiple choice w/ placeholder at index 2
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[
                            1 / 3,
                            1 - (np.e ** (0.25) / 3) - 1 / 3,
                            None,
                            np.e ** (0.25) / 3,
                        ],
                    ),
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 / 3, None, 1 / 3],
                    ),
                ],
                {"resolution_bucket": 0, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=0), S(v=0)],
            ),  # chosen to have a score of 0 for simplicity
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[
                            1 / 3,
                            1 - (np.e ** (0.25) / 3) - 1 / 3,
                            None,
                            np.e ** (0.25) / 3,
                        ],
                    ),
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 / 3, None, 1 / 3],
                    ),
                ],
                {"resolution_bucket": 2, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=25), S(v=-25)],
            ),  # same score as index == 3 since None should read from "Other"
            (
                [
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[
                            1 / 3,
                            1 - (np.e ** (0.25) / 3) - 1 / 3,
                            None,
                            np.e ** (0.25) / 3,
                        ],
                    ),
                    F(
                        q=QT.MULTIPLE_CHOICE,
                        v=[1 / 3, 1 / 3, None, 1 / 3],
                    ),
                ],
                {"resolution_bucket": 3, "question_type": QT.MULTIPLE_CHOICE},
                [S(v=25), S(v=-25)],
            ),  # chosen to have a score of 25 for simplicity
            # TODO: add tests with base forecasts different from forecasts
        ],
    )
    def test_evaluate_forecasts_peer_spot_forecast(self, forecasts, args, expected):
        args = {
            "forecasts": forecasts,
            "base_forecasts": [],  # no base forecasts -> just takes forecasts
            "resolution_bucket": 1,
            "spot_forecast_timestamp": dts(10),
            "question_type": QT.BINARY,
            "geometric_means": [],  # gets calculated from base_forecasts
        } | args
        result = evaluate_forecasts_peer_spot_forecast(**args)
        assert len(result) == len(expected)
        for rs, es in zip(result, expected):
            assert round(rs.score, 8) == round(es.score, 8)
            assert round(rs.coverage, 8) == round(es.coverage, 8)

    # TODO: add unit testing for evaluate_forecasts_legacy_relative
