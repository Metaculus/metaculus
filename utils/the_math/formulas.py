from datetime import datetime, timezone
import numpy as np

from questions.models import Question

# string_location <> scaled_location <> unscaled_location <> bucket_index
# string_location: the human-readable representation of the location
# scaled_location: the location in actual scale
#     binary: 0 or 1
#     multiple_choice: some int of the index of the option
#     continuous: the actual value in float form
# unscaled_location: an internal representation of the location
#     binary: 0 or 1
#     multiple_choice: some int of the index of the option
#     continuous: -1 for below lower bound, 2 for above upper bound,
#         0 to 1 for the value within bounds, is not logarithmicly scaled
# bucket_index: the index of the bucket for scoring when viewing the forecast
#     as a PMF


def string_location_to_scaled_location(
    string_location: str, question: Question
) -> float:
    if string_location in ["ambiguous", "annulled"]:
        raise ValueError("Cannot convert ambiguous or annulled to any real locations")
    if question.type == "binary":
        return 1.0 if string_location == "yes" else 0.0
    if question.type == "multiple_choice":
        return float(question.options.index(string_location))
    # continuous
    if string_location == "below_lower_bound":
        return question.min - 1.0
    if string_location == "above_upper_bound":
        return question.max + 1.0
    if question.type == "date":
        return datetime.fromisoformat(string_location).timestamp()
    # question.type == "numeric"
    return float(string_location)


def scaled_location_to_string_location(
    scaled_location: float, question: Question
) -> str:
    if question.type == "binary":
        return "yes" if scaled_location > 0.5 else "no"
    if question.type == "multiple_choice":
        return question.options[int(scaled_location)]
    # continuous
    if scaled_location < question.min:
        return "below_lower_bound"
    if scaled_location > question.max:
        return "above_upper_bound"
    if question.type == "date":
        return datetime.fromtimestamp(scaled_location, tz=timezone.utc).isoformat()
    # question.type == "numeric"
    return str(scaled_location)


def unscaled_location_to_scaled_location(
    unscaled_location: float, question: Question
) -> float:
    if question.type == "binary":
        return unscaled_location
    if question.type == "multiple_choice":
        return unscaled_location
    # continuous
    zero_point, range_max, range_min = question.zero_point, question.max, question.min
    if zero_point:
        deriv_ratio = (range_max - zero_point) / max(
            (range_min - zero_point), 0.0000001
        )
        return range_min + (range_max - range_min) * (
            deriv_ratio**unscaled_location - 1
        ) / (deriv_ratio - 1)
    return range_min + (range_max - range_min) * unscaled_location


def scaled_location_to_unscaled_location(
    scaled_location: float, question: Question
) -> float:
    if question.type == "binary":
        return scaled_location
    if question.type == "multiple_choice":
        return scaled_location
    zero_point, range_max, range_min = question.zero_point, question.max, question.min
    if zero_point:
        deriv_ratio = (range_max - zero_point) / max(
            (range_min - zero_point), 0.0000001
        )
        return (
            np.log(
                (scaled_location - range_min) * (deriv_ratio - 1)
                + (range_max - range_min)
            )
            - np.log(range_max - range_min)
        ) / np.log(deriv_ratio)
    return (scaled_location - range_min) / (range_max - range_min)


def unscaled_location_to_bucket_index(
    unscaled_location: float, question: Question
) -> int:
    if question.type == "binary":
        return int(unscaled_location)
    if question.type == "multiple_choice":
        return int(unscaled_location)
    # continuous
    if unscaled_location < 0:
        return 0
    if unscaled_location > 1:
        return 201
    if unscaled_location == 1:
        return 200
    return max(int(unscaled_location * 200 + 1 - 1e-10), 1)


def unscaled_location_to_string_location(
    unscaled_location: float, question: Question
) -> str:
    scaled_location = unscaled_location_to_scaled_location(unscaled_location, question)
    return scaled_location_to_string_location(scaled_location, question)


def bucket_index_to_unscaled_location(bucket_index: int, question: Question) -> float:
    if question.type == "binary":
        return bucket_index
    if question.type == "multiple_choice":
        return bucket_index
    # continuous
    if bucket_index <= 0:
        return -1
    if bucket_index >= 201:
        return 2
    return bucket_index / 200 - 1 / 400


def string_location_to_bucket_index(string_location: str, question: Question) -> int:
    scaled_location = string_location_to_scaled_location(string_location, question)
    unscaled_location = scaled_location_to_unscaled_location(scaled_location, question)
    return unscaled_location_to_bucket_index(unscaled_location, question)


def get_scaled_quartiles_from_cdf(cdf: list[float], question: Question):
    from utils.the_math.measures import percent_point_function

    lower = unscaled_location_to_scaled_location(
        percent_point_function(cdf, 25), question
    )
    middle = unscaled_location_to_scaled_location(
        percent_point_function(cdf, 50), question
    )
    upper = unscaled_location_to_scaled_location(
        percent_point_function(cdf, 75), question
    )
    return [lower, middle, upper]
