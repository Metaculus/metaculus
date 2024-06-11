from datetime import datetime

from questions.models import Question


def internal_location_to_actual_location(
    question: Question, internal_location: float
) -> float:
    if question.zero_point:
        deriv_ratio = (question.max - question.zero_point) / (
            question.min - question.zero_point
        )
        return question.min + (question.max - question.min) * (
            deriv_ratio**internal_location - 1
        ) / (deriv_ratio - 1)
    return question.min + (question.max - question.min) * internal_location


def scale_location(question: Question, unscaled_location: float) -> float:
    if question.zero_point:
        deriv_ratio = (question.max - question.zero_point) / (
            question.min - question.zero_point
        )
        return (
            1
            + (deriv_ratio - 1)
            * (unscaled_location - question.min)
            / (question.max - question.min)
        ) ** (1 / deriv_ratio)
    return (unscaled_location - question.min) / (question.max - question.min)


def string_location_to_bucket_index(question: Question, string_location: str) -> int:
    if question.type == "binary":
        return 1 if string_location == "yes" else 0
    if question.type == "multiple_choice":
        return question.options.index(string_location)
    # continuous
    if question.type == "date":
        float_location = datetime.fromisoformat(string_location).timestamp()
    else:
        float_location = float(string_location)
    scaled_location = scale_location(question, float_location)
    if scaled_location < 0:
        return 0
    if scaled_location > 1:
        return 201
    if scaled_location == 1:
        return 200
    return int(scaled_location * 200 + 1 + 1e-7)
