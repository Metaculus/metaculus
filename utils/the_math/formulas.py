from datetime import datetime

from questions.models import Question


def scale_location(zero_point: float, max: float, min: float, unscaled_location: float) -> float:
    if zero_point:
        deriv_ratio = (max - zero_point) / (
            min - zero_point
        )
        return min + (max - min) * (
            deriv_ratio**unscaled_location - 1
        ) / (deriv_ratio - 1)
    return min + (max - min) * unscaled_location


def unscale_location(zero_point: float, max: float, min: float, scaled_location: float) -> float:
    if zero_point:
        deriv_ratio = (max - zero_point) / (
            min - zero_point
        )
        return (
            1
            + (deriv_ratio - 1)
            * (scaled_location - min)
            / (max - min)
        ) ** (1 / deriv_ratio)
    return (scaled_location - min) / (max - min)


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
    unscaled_location = unscale_location(question.zero_point, question.max, question.min, scaled_location)
    if unscaled_location < 0:
        return 0
    if unscaled_location > 1:
        return 201
    if unscaled_location == 1:
        return 200
    return int(unscaled_location * 200 + 1 + 1e-7)
