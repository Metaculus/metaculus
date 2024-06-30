from datetime import datetime
import numpy as np

from questions.models import Question


def scale_location(
    zero_point: float, range_max: float, range_min: float, unscaled_location: float
) -> float:
    if zero_point:
        deriv_ratio = (range_max - zero_point) / (range_min - zero_point)
        return range_min + (range_max - range_min) * (
            deriv_ratio**unscaled_location - 1
        ) / (deriv_ratio - 1)
    return range_min + (range_max - range_min) * unscaled_location


def unscale_location(
    zero_point: float, range_max: float, range_min: float, scaled_location: float
) -> float:
    if zero_point:
        deriv_ratio = (range_max - zero_point) / (range_min - zero_point)
        return (
            np.log(
                (scaled_location - range_min) * (deriv_ratio - 1)
                + (range_max - range_min)
            )
            - np.log(range_max - range_min)
        ) / np.log(deriv_ratio)
    return (scaled_location - range_min) / (range_max - range_min)


def string_location_to_bucket_index(question: Question, string_location: str) -> int:
    if question.type == "binary":
        return 1 if string_location == "yes" else 0
    if question.type == "multiple_choice":
        return question.options.index(string_location)
    # continuous
    if string_location == "below_lower_bound":
        return 0
    if string_location == "above_upper_bound":
        return 201
    if question.type == "date":
        scaled_location = datetime.fromisoformat(string_location).timestamp()
    else:
        scaled_location = float(string_location)
    unscaled_location = unscale_location(
        question.zero_point, question.max, question.min, scaled_location
    )
    if unscaled_location < 0:
        return 0
    if unscaled_location > 1:
        return 201
    if unscaled_location == 1:
        return 200
    return max(int(unscaled_location * 200 + 1 - 1e-10), 0)
