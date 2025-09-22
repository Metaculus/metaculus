import math
import statistics
from typing import List

from scipy.stats import sem

from coherence.models import CoherenceLink


def convert_to_vector(direction: str, strength: str) -> int:
    direction_map = {
        "positive": 1,
        "negative": -1,
    }

    strength_map = {"low": 1, "medium": 2, "high": 3}
    return direction_map[direction] * strength_map[strength]


def custom_round(x: float) -> int:
    fractional_part = abs(x - int(x))
    if abs(fractional_part - 0.5) < 1e-10:
        return int(x)
    else:
        return round(x)


def convert_to_direction_strength(
        vector_value: float,
):
    strength_map = {1: "low", 2: "medium", 3: "high"}
    vector_value = custom_round(vector_value)
    if vector_value == 0:
        return "none", "none"
    direction = "positive" if vector_value > 0 else "negative"
    strength = strength_map[abs(vector_value)]
    return direction, strength


def get_aggregation_results(links: List[CoherenceLink]):
    if len(links) == 0:
        return "none", "none", "inf"
    elif len(links) == 1:
        link = links[0]
        return link.direction, link.strength, "inf"
    else:
        vectors = [convert_to_vector(link.direction, link.strength) for link in links]
        mean = statistics.mean(vectors)
        mean_direction, mean_strength = convert_to_direction_strength(mean)
        relative_standard_error_mean = abs(
            float(sem(vectors) / mean if mean != 0 else "inf")
        )
        if math.isinf(relative_standard_error_mean):
            relative_standard_error_mean = "inf"
        return mean_direction, mean_strength, relative_standard_error_mean
