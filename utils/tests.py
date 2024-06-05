import numpy as np
import pytest

from utils.the_math.measures import weighted_percentile_2d


@pytest.mark.parametrize(
    "predictions, weights, percentile, expected_result",
    [
        ([[0.5, 0.5], [0.6, 0.4]], None, 50.0, [0.55, 0.45]),
        ([[0.5, 0.5], [0.6, 0.4]], None, 40.0, [0.5, 0.4]),
        ([[0.3, 0.7], [0.6, 0.4], [0.1, 0.9]], None, 50.0, [0.3, 0.7]),
        ([[0.5, 0.5], [0.6, 0.4], [0.1, 0.9]], [0.1, 0.1, 1.0], 50.0, [0.1, 0.9]),
        (
            [
                [0.33, 0.33, 0.34],
                [0.0, 0.5, 0.5],
                [0.4, 0.2, 0.4],
            ],
            None,
            50.0,
            [0.33, 0.33, 0.4],  # Does not sum to 1, and that's okay
        ),
        (
            [
                [1.0, 0.0, 0.0],
                [0.0, 1.0, 0.0],
                [0.0, 0.0, 1.0],
            ],
            None,
            50.0,
            [0.0, 0.0, 0.0],
        ),
        (
            [
                [0.33, 0.33, 0.34],
                [0.0, 0.5, 0.5],
                [0.4, 0.2, 0.4],
                [0.2, 0.6, 0.2],
            ],
            None,
            50.0,
            [0.265, 0.415, 0.37],
        ),
        (
            [
                [0.33, 0.33, 0.34],
                [0.0, 0.5, 0.5],
                [0.4, 0.2, 0.4],
                [0.2, 0.6, 0.2],
            ],
            [0.1, 0.2, 0.3, 0.4],
            50.0,
            [0.2, 0.5, 0.37],
        ),
    ],
)
def test_weighted_percentile_2d(values, weights, percentile, expected_result):
    values = np.array(values)
    weights = np.array(weights) if weights is not None else None

    result = weighted_percentile_2d(
        values=values, weights=weights, percentile=percentile
    )
    np.testing.assert_allclose(result, expected_result)
    if weights is None and percentile == 50.0:  # should behave like np.median
        numpy_medians = np.median(values, axis=0)
        np.testing.assert_allclose(result, numpy_medians)
