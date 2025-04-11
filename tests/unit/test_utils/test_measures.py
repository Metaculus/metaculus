import numpy as np
import pytest

from questions.models import Question
from utils.the_math.measures import (
    weighted_percentile_2d,
    percent_point_function,
    prediction_difference_for_sorting,
    prediction_difference_for_display,
    decimal_h_index,
)


@pytest.mark.parametrize(
    "values, weights, percentiles, expected_result",
    [
        ([[0.5, 0.5], [0.6, 0.4]], None, [50.0], [[0.55, 0.45]]),
        ([[0.5, 0.5], [0.6, 0.4]], None, [40.0], [[0.5, 0.4]]),
        ([[0.5, 0.5], [0.6, 0.4]], None, [50.0, 40.0], [[0.55, 0.45], [0.5, 0.4]]),
        ([[0.3, 0.7], [0.6, 0.4], [0.1, 0.9]], None, [50.0], [[0.3, 0.7]]),
        ([[0.5, 0.5], [0.6, 0.4], [0.1, 0.9]], [0.1, 0.1, 1.0], [50.0], [[0.1, 0.9]]),
        (
            [
                [0.33, 0.33, 0.34],
                [0.0, 0.5, 0.5],
                [0.4, 0.2, 0.4],
            ],
            None,
            [50.0],
            [[0.33, 0.33, 0.4]],  # Does not sum to 1, and that's okay
        ),
        (
            [
                [1.0, 0.0, 0.0],
                [0.0, 1.0, 0.0],
                [0.0, 0.0, 1.0],
            ],
            None,
            [50.0],
            [[0.0, 0.0, 0.0]],
        ),
        (
            [
                [0.33, 0.33, 0.34],
                [0.0, 0.5, 0.5],
                [0.4, 0.2, 0.4],
                [0.2, 0.6, 0.2],
            ],
            None,
            [50.0],
            [[0.265, 0.415, 0.37]],
        ),
        (
            [
                [0.33, 0.33, 0.34],
                [0.0, 0.5, 0.5],
                [0.4, 0.2, 0.4],
                [0.2, 0.6, 0.2],
            ],
            [0.1, 0.2, 0.3, 0.4],
            [50.0],
            [[0.2, 0.5, 0.37]],
        ),
    ],
)
def test_weighted_percentile_2d(values, weights, percentiles, expected_result):
    values = np.array(values)
    weights = np.array(weights) if weights is not None else None

    result = weighted_percentile_2d(
        values=values, weights=weights, percentiles=percentiles
    )
    np.testing.assert_allclose(result, expected_result)
    if weights is None and [percentiles] == [50.0]:  # should behave like np.median
        numpy_medians = np.median(values, axis=0)
        np.testing.assert_allclose(result, [numpy_medians])


@pytest.mark.parametrize(
    "cdf, percentiles, expected_result",
    [
        ([0.1, 0.5, 0.9], 50, [0.5]),
        ([0.1, 0.5, 0.9], [10, 50, 90], [0.0, 0.5, 1.0]),
        (np.linspace(0, 0.5, 101), 40, [0.8]),
    ],
)
def test_percent_point_function(cdf, percentiles, expected_result):
    result = percent_point_function(cdf, percentiles)
    np.testing.assert_allclose(result, expected_result)


@pytest.mark.parametrize(
    "p1, p2, question, expected_result",
    [
        (
            [0.5, 0.5],
            [0.5, 0.5],
            Question(type="binary"),
            0.0,
        ),
        (
            [0.5, 0.5],
            [0.6, 0.4],
            Question(type="binary"),
            sum([-0.1 * np.log2(0.5 / 0.6), 0.1 * np.log2(0.5 / 0.4)]),  # 0.05849625
        ),
        (
            [0.5, 0.5],
            [0.5, 0.5],
            Question(type="multiple_choice"),
            0.0,
        ),
        (
            [0.5, 0.5],
            [0.6, 0.4],
            Question(type="multiple_choice"),
            0.05849625,
        ),
        (
            [0.1, 0.2, 0.3, 0.4],
            [0.1, 0.2, 0.3, 0.4],
            Question(type="multiple_choice"),
            0.0,
        ),
        (
            [0.1, 0.2, 0.3, 0.4],
            [0.4, 0.3, 0.2, 0.1],
            Question(type="multiple_choice"),
            sum(
                [
                    (0.1 - 0.4) * np.log2(0.1 / 0.4),
                    (0.2 - 0.3) * np.log2(0.2 / 0.3),
                    (0.3 - 0.2) * np.log2(0.3 / 0.2),
                    (0.4 - 0.1) * np.log2(0.4 / 0.1),
                ]
            ),  # 1.3169925
        ),
        (
            [0.01, 0.5, 0.99],
            [0.01, 0.5, 0.99],
            Question(
                type="numeric",
                range_min=0,
                range_max=1,
                zero_point=None,
            ),
            0.0,
        ),
        (
            [0.01, 0.02, 0.03],
            [0.97, 0.98, 0.99],
            Question(
                type="numeric",
                range_min=0,
                range_max=1,
                zero_point=None,
            ),
            10.9793888,
        ),
        (
            [0.01, 0.02, 0.03],
            [0.97, 0.98, 0.99],
            Question(
                type="numeric",
                range_min=99,
                range_max=100,
                zero_point=None,
            ),
            10.9793888,
        ),
        (
            [0.01, 0.02, 0.03],
            [0.97, 0.98, 0.99],
            Question(
                type="numeric",
                range_min=0,
                range_max=100,
                zero_point=None,
            ),
            10.9793888,
        ),
        (
            [0.01, 0.02, 0.98, 0.99],
            [0.48, 0.49, 0.51, 0.52],
            Question(
                type="numeric",
                range_min=0,
                range_max=1,
                zero_point=None,
            ),
            2.7616993,
        ),
        (
            [0.0, 0.48, 0.49, 0.51, 0.52, 1.0],
            [0.0, 0.01, 0.49, 0.51, 0.99, 1.0],
            Question(
                type="numeric",
                range_min=0,
                range_max=1,
                zero_point=None,
            ),
            1.2246093,
        ),
    ],
)
def test_prediction_difference_for_sorting(p1, p2, question, expected_result):
    result = prediction_difference_for_sorting(p1, p2, question.type)
    assert np.isclose(result, expected_result)


@pytest.mark.parametrize(
    "p1, p2, question, expected_result",
    [
        (
            [0.5, 0.5],
            [0.5, 0.5],
            Question(type="binary"),
            [
                (0.0, 1 / 1),
            ],
        ),
        (
            [0.5, 0.5],
            [0.6, 0.4],
            Question(type="binary"),
            [
                (-0.1, (2 / 3) / 1),
            ],
        ),
        (
            [0.5, 0.5],
            [0.5, 0.5],
            Question(type="multiple_choice"),
            [
                (0.0, 1 / 1),
                (0.0, 1 / 1),
            ],
        ),
        (
            [0.5, 0.5],
            [0.6, 0.4],
            Question(type="multiple_choice"),
            [
                (0.1, (3 / 2) / 1),
                (-0.1, (2 / 3) / 1),
            ],
        ),
        (
            [0.1, 0.2, 0.3, 0.4],
            [0.1, 0.2, 0.3, 0.4],
            Question(type="multiple_choice"),
            [
                (0.0, (1 / 9) / (1 / 9)),
                (0.0, (2 / 8) / (2 / 8)),
                (0.0, (3 / 7) / (3 / 7)),
                (0.0, (4 / 6) / (4 / 6)),
            ],
        ),
        (
            [0.1, 0.2, 0.3, 0.4],
            [0.4, 0.3, 0.2, 0.1],
            Question(type="multiple_choice"),
            [
                (0.3, (4 / 6) / (1 / 9)),
                (0.1, (3 / 7) / (2 / 8)),
                (-0.1, (2 / 8) / (3 / 7)),
                (-0.3, (1 / 9) / (4 / 6)),
            ],
        ),
        (
            [0.0, 0.5, 1.0],
            [0.0, 0.5, 1.0],
            Question(
                type="numeric",
                range_min=0,
                range_max=1,
                zero_point=None,
            ),
            [
                (0.0, 0.0),
            ],
        ),
        (
            [0.0, 0.0, 0.0],
            [1.0, 1.0, 1.0],
            Question(
                type="numeric",
                range_min=0,
                range_max=1,
                zero_point=None,
            ),
            [
                (1.0, 1.0),
            ],
        ),
        (
            [0.0, 0.0, 0.0],
            [1.0, 1.0, 1.0],
            Question(
                type="numeric",
                range_min=99,
                range_max=100,
                zero_point=None,
            ),
            [
                (1.0, 1.0),
            ],
        ),
        (
            [0.0, 0.0, 0.0],
            [1.0, 1.0, 1.0],
            Question(
                type="numeric",
                range_min=0,
                range_max=100,
                zero_point=None,
            ),
            [
                (100.0, 100.0),
            ],
        ),
        (
            [0.0, 0.0, 1.0, 1.0],
            [0.5, 0.5, 0.5, 0.5],
            Question(
                type="numeric",
                range_min=0,
                range_max=1,
                zero_point=None,
            ),
            [
                (0.5, 0.0),
            ],
        ),
        (
            [0.0, 0.5, 0.5, 0.5, 0.5, 1.0],
            [0.0, 0.0, 0.5, 0.5, 1.0, 1.0],
            Question(
                type="numeric",
                range_min=0,
                range_max=1,
                zero_point=None,
            ),
            [
                (0.2, 0.0),
            ],
        ),
    ],
)
def test_prediction_difference_for_display(p1, p2, question, expected_result):
    result = prediction_difference_for_display(p1, p2, question)
    for res, exp in zip(result, expected_result):
        assert np.allclose(res, exp, equal_nan=True)


@pytest.mark.parametrize(
    "scores, expected_result",
    [
        ([2, 2], 2.0 + round(0 / 4, 2)),
        ([2, 2, 1], 2 + round(1 / 5, 2)),
        ([10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 5 + round(10 / 11, 2)),
    ],
)
def test_decimal_h_index(scores, expected_result):
    result = decimal_h_index(scores)
    assert np.isclose(result, expected_result)
