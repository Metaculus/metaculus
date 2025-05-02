from typing import TYPE_CHECKING

import numpy as np

from utils.the_math.formulas import unscaled_location_to_scaled_location
from utils.typing import (
    ForecastValues,
    ForecastsValues,
    Weights,
    Percentiles,
)

if TYPE_CHECKING:
    from questions.models import Question


def weighted_percentile_2d(
    values: ForecastsValues,
    weights: Weights | None = None,
    percentiles: Percentiles | None = None,
) -> Percentiles:
    values = np.array(values)
    if weights is None:
        ordered_weights = np.ones_like(values)
    else:
        weights = np.array(weights)
        ordered_weights = weights[values.argsort(axis=0)]
    percentiles = np.array(percentiles or [50.0])

    sorted_values = values.copy()  # avoid side effects
    sorted_values.sort(axis=0)

    # get the normalized cumulative weights
    normalized_cumulative_weights = np.cumsum(ordered_weights, axis=0) / np.sum(
        ordered_weights, axis=0
    )
    weighted_percentiles = []
    for percentile in percentiles:
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
        weighted_percentiles.append(
            0.5
            * (
                sorted_values[left_indexes, column_indicies]
                + sorted_values[right_indexes, column_indicies]
            )
        )
    return np.array(weighted_percentiles)


def percent_point_function(
    cdf: ForecastValues, percentiles: Percentiles | float | int
) -> Percentiles:
    """returns the x-location in the cdf where it crosses the given percentiles,
    treating the cdf as starting at x=0 and ending at x=1

    e.g. cdf = [0.1, 0.5, 0.9]
    percent_point_function(cdf, 50) -> 0.5
    percent_point_function(cdf, [10, 50, 90]) -> [0.0, 0.5, 1.0]
    """
    if return_float := isinstance(percentiles, float | int):
        percentiles = [percentiles]
    ppf_values = []
    for percent in percentiles:
        # percent is a float between 0 and 100
        if percent < cdf[0] * 100:
            ppf_values.append(0.0)
        elif percent >= cdf[-1] * 100:
            ppf_values.append(1.0)
        else:
            length = len(cdf)
            for i in range(length - 1):
                left = cdf[i] * 100
                if left == percent:
                    ppf_values.append(i / (length - 1))
                    break
                right = cdf[i + 1] * 100
                if left < percent < right:
                    # linear interpolation
                    ppf_values.append(
                        (i + (percent - left) / (right - left)) / (length - 1)
                    )
                    break
    return np.array(ppf_values[0] if return_float else ppf_values)


def prediction_difference_for_sorting(
    p1: ForecastValues, p2: ForecastValues, question: "Question"
) -> float:
    """for binary and multiple choice, takes pmfs
    for continuous takes cdfs"""
    p1, p2 = np.array(p1), np.array(p2)
    # Uses Jeffrey's Divergence
    if question.type in ["binary", "multiple_choice"]:
        return sum([(p - q) * np.log2(p / q) for p, q in zip(p1, p2)])
    cdf1 = np.array([1 - np.array(p1), p1])
    cdf2 = np.array([1 - np.array(p2), p2])
    divergences = np.sum(
        (cdf1 - cdf2) * np.log2(cdf1 / cdf2), axis=0, where=np.abs(cdf1 - cdf2) > 1e-7
    )
    return float(np.trapz(divergences, x=np.linspace(0, 1, len(p1))))


def prediction_difference_for_display(
    p1: ForecastValues, p2: ForecastValues, question: "Question"
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
        np.linspace(0, 1, len(p1)), question
    )
    # TODO: Discuss this with Luke, looks like it should be np.array(p2) - np.array(p1) instead!
    diffs = np.array(p1) - np.array(p2)
    total = float(np.trapz(np.abs(diffs), x=x_locations))
    asymmetric = float(-np.trapz(diffs, x=x_locations))
    return [
        (
            total if not np.isnan(total) else None,
            asymmetric if not np.isnan(asymmetric) else None,
        )
    ]


def calculate_max_centers_difference(
    p1: ForecastValues,
    p2: ForecastValues,
    question: "Question",
) -> float:
    if not p1 or not p2 or len(p1) != len(p2):
        return 0.0

    if question.type == "binary":
        return p2[1] - p1[1]
    if question.type == "multiple_choice":
        return max([c2 - c1 for c1, c2 in zip(p1, p2)], key=abs)

    return p2[0] - p1[0]


def decimal_h_index(scores) -> float:
    """takes a list of scores and returns the decimal h-index
    https://en.wikipedia.org/wiki/H-index#Calculation"""
    sorted_scores = sorted(list(scores), reverse=True)
    base = sum(x >= i + 1 for i, x in enumerate(sorted_scores))
    fraction_scores = sorted_scores[: base + 1]
    numerator = sum(min(base + 1, f) for f in fraction_scores) - base**2
    denominator = (base + 1) ** 2 - base**2
    fraction = round(numerator / denominator, 2)
    return base + fraction
