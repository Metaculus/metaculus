import numpy as np


def weighted_percentile_2d(
    values: list[list[float]] | np.ndarray,
    weights: list[float] | np.ndarray | None = None,
    percentile: float = 50.0,
) -> np.ndarray:
    values = np.array(values)
    if weights is None:
        ordered_weights = np.ones_like(values)
    else:
        ordered_weights = weights[values.argsort(axis=0)]

    sorted_values = values.copy()  # avoid side effects
    sorted_values.sort(axis=0)

    # get the normalized cumulative weights
    normalized_cumulative_weights = np.cumsum(ordered_weights, axis=0) / np.sum(
        ordered_weights, axis=0
    )
    # find the index which corresponds to the values whose weight surrounds the value
    # percentile (most of the time left_index == right_index)
    right_indexes = np.argmax(
        normalized_cumulative_weights > (percentile / 100.0), axis=0
    )
    left_indexes = np.argmax(
        normalized_cumulative_weights >= (percentile / 100.0), axis=0
    )
    # return the median of these values
    column_indicies = np.arange(values.shape[1])
    return 0.5 * (
        sorted_values[left_indexes, column_indicies]
        + sorted_values[right_indexes, column_indicies]
    )
