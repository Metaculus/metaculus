import numpy as np

from questions.models import Question
from utils.the_math.formulas import unscaled_location_to_scaled_location


def weighted_percentile_2d(
    values: list[list[float]] | np.ndarray,
    weights: list[float] | np.ndarray | None = None,
    percentile: float = 50.0,
) -> np.ndarray:
    values = np.array(values)
    if weights is None:
        ordered_weights = np.ones_like(values)
    else:
        weights = np.array(weights)
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


def percent_point_function(cdf: list[float], percent: float) -> float:
    # percent is a float between 0 and 100
    if percent < cdf[0] * 100:
        return 0.0
    if percent > cdf[-1] * 100:
        return 1.0
    length = len(cdf)
    for i in range(length - 1):
        left = cdf[i] * 100
        if left == percent:
            return i / (length - 1)
        right = cdf[i + 1] * 100
        if left < percent < right:
            # linear interpolation
            return (i + (percent - left) / (right - left)) / (length - 1)
    return 1.0


def prediction_difference_for_sorting(
    p1: list[float], p2: list[float], question: Question
) -> float:
    """for binary and multiple choice, takes pmfs
    for continuous takes cdfs"""
    p1, p2 = np.array(p1), np.array(p2)
    # Uses Jeffrey's Divergence
    if question.type in ["binary", "multiple_choice"]:
        return sum([(p - q) * np.log2(p / q) for p, q in zip(p1, p2)])
    cdf1 = np.array([1 - np.array(p1), p1])
    cdf2 = np.array([1 - np.array(p2), p2])
    divergences = np.sum((cdf1 - cdf2) * np.log2(cdf1 / cdf2), axis=0)
    return float(np.trapz(divergences, x=np.linspace(0, 1, len(p1))))


def prediction_difference_for_display(
    p1: list[float], p2: list[float], question: Question
) -> list[tuple[float, float]]:
    """for binary and multiple choice, takes pmfs
    for continuous takes cdfs"""
    if question.type == "binary":
        # single-item list of (abs pred diff, ratio of odds)
        return [(p2[1] - p1[1], (p2[1] / (1 - p2[1])) / (p1[1] / (1 - p1[1])))]
    elif question.type == "multiple_choice":
        # list of (abs pred diff, ratio of odds)
        return [(q - p, (q / (1 - q)) / (p / (1 - p))) for p, q in zip(p1, p2)]
    # total earth mover's distance, assymmetric earth mover's distance
    x_locations = unscaled_location_to_scaled_location(
        np.linspace(
            question.range_min,
            question.range_max,
            len(p1),
        ),
        question,
    )
    diffs = np.array(p1) - np.array(p2)
    total = float(np.trapz(np.abs(diffs), x=x_locations))
    asymmetric = float(-np.trapz(diffs, x=x_locations))
    return [
        (
            total if not np.isnan(total) else None,
            asymmetric if not np.isnan(asymmetric) else None,
        )
    ]


def decimal_h_index(scores):
    sorted_scores = sorted(list(scores), reverse=True)
    base = sum(x >= i + 1 for i, x in enumerate(sorted_scores))
    fraction_scores = sorted_scores[: base + 1]
    numerator = sum(min(base + 1, f) for f in fraction_scores) - base**2
    denominator = (base + 1) ** 2 - base**2
    fraction = round(numerator / denominator, 2)
    return base + fraction
