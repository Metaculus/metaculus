from questions.models import Question


def scale_continous_forecast_location(
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
