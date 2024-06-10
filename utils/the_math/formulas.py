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


def actual_location_to_internal_location(
    question: Question, actual_location: float
) -> float:
    if question.zero_point:
        deriv_ratio = (question.max - question.zero_point) / (
            question.min - question.zero_point
        )
        return (
            1
            + (deriv_ratio - 1)
            * (actual_location - question.min)
            / (question.max - question.min)
        ) ** (1 / deriv_ratio)
    return (actual_location - question.min) / (question.max - question.min)


def nominal_location_to_internal_location(
    question: Question, nominal_location: float | str | datetime
) -> float:
    if isinstance(nominal_location, str):
        nominal_location = datetime.fromisoformat(nominal_location)
    if isinstance(nominal_location, datetime):
        nominal_location = nominal_location.timestamp()
    return actual_location_to_internal_location(question, nominal_location)


def internal_location_to_bucket_index(internal_location: float) -> int:
    if internal_location == -1:
        return 0
    if internal_location == 2:
        return 201
    if internal_location == 1:
        return 200
    return int(internal_location * 200 + 1 + 1e-7)


def nominal_location_to_bucket_index(
    question: Question, nominal_location: float | str | datetime
) -> int:
    if question.type == "binary":
        return 1 if nominal_location == "yes" else 0
    if question.type == "multiple_choice":
        return question.options.index(nominal_location)
    return internal_location_to_bucket_index(
        nominal_location_to_internal_location(question, nominal_location)
    )
