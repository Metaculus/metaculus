from datetime import datetime

from questions.models import Question


def scale_location(question: Question, unscaled_location: float) -> float:
    if question.zero_point:
        deriv_ratio = (question.max - question.zero_point) / (
            question.min - question.zero_point
        )
        return question.min + (question.max - question.min) * (
            deriv_ratio**unscaled_location - 1
        ) / (deriv_ratio - 1)
    return question.min + (question.max - question.min) * unscaled_location


def unscale_location(question: Question, scaled_location: float) -> float:
    if question.zero_point:
        deriv_ratio = (question.max - question.zero_point) / (
            question.min - question.zero_point
        )
        return (
            1
            + (deriv_ratio - 1)
            * (scaled_location - question.min)
            / (question.max - question.min)
        ) ** (1 / deriv_ratio)
    return (scaled_location - question.min) / (question.max - question.min)


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
    unscaled_location = unscale_location(question, scaled_location)
    if unscaled_location < 0:
        return 0
    if unscaled_location > 1:
        return 201
    if unscaled_location == 1:
        return 200
    return int(unscaled_location * 200 + 1 + 1e-7)
