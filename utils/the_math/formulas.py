import logging
from datetime import datetime, timezone

import numpy as np

from questions.constants import UnsuccessfulResolutionType
from questions.models import Question
from utils.typing import ForecastValues

logger = logging.getLogger(__name__)


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
    if string_location in UnsuccessfulResolutionType:
        raise ValueError("Cannot convert ambiguous or annulled to any real locations")
    if question.type == Question.QuestionType.BINARY:
        return 1.0 if string_location == "yes" else 0.0
    if question.type == Question.QuestionType.MULTIPLE_CHOICE:
        return float(question.options.index(string_location))
    # continuous
    if string_location == "below_lower_bound":
        return question.range_min - 1.0
    if string_location == "above_upper_bound":
        return question.range_max + 1.0
    if question.type == Question.QuestionType.DATE:
        return datetime.fromisoformat(string_location).timestamp()
    # question.type in [Question.QuestionType.NUMERIC, Question.QuestionType.DISCRETE]
    return float(string_location)


def scaled_location_to_string_location(
    scaled_location: float, question: Question
) -> str:
    if question.type == Question.QuestionType.BINARY:
        return "yes" if scaled_location > 0.5 else "no"
    if question.type == Question.QuestionType.MULTIPLE_CHOICE:
        return question.options[int(scaled_location)]
    # continuous
    if scaled_location < question.range_min:
        return "below_lower_bound"
    if scaled_location > question.range_max:
        return "above_upper_bound"
    if question.type == Question.QuestionType.DATE:
        return datetime.fromtimestamp(scaled_location, tz=timezone.utc).isoformat()
    # question.type in [Question.QuestionType.NUMERIC, Question.QuestionType.DISCRETE]
    return str(scaled_location)


def unscaled_location_to_scaled_location(
    unscaled_location: float, question: Question
) -> float:
    if question.type == Question.QuestionType.BINARY:
        return unscaled_location
    if question.type == Question.QuestionType.MULTIPLE_CHOICE:
        return unscaled_location
    # continuous
    zero_point, range_max, range_min = (
        question.zero_point,
        question.range_max,
        question.range_min,
    )

    if range_max is None or range_min is None:
        logger.warning(
            f"Question {question.id} has nullable range_max or range_min value"
        )

        return unscaled_location

    if zero_point is not None:
        deriv_ratio = (range_max - zero_point) / (range_min - zero_point)
        return range_min + (range_max - range_min) * (
            deriv_ratio**unscaled_location - 1
        ) / (deriv_ratio - 1)
    return range_min + (range_max - range_min) * unscaled_location


def scaled_location_to_unscaled_location(
    scaled_location: float, question: Question
) -> float:
    if question.type == Question.QuestionType.BINARY:
        return scaled_location
    if question.type == Question.QuestionType.MULTIPLE_CHOICE:
        return scaled_location
    zero_point, range_max, range_min = (
        question.zero_point,
        question.range_max,
        question.range_min,
    )
    if zero_point is not None:
        deriv_ratio = (range_max - zero_point) / (range_min - zero_point)
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
    if question.type == Question.QuestionType.BINARY:
        return int(unscaled_location)
    if question.type == Question.QuestionType.MULTIPLE_CHOICE:
        return int(unscaled_location)
    # continuous
    if unscaled_location < 0:
        return 0
    if unscaled_location > 1:
        return question.get_inbound_outcome_count() + 1
    if unscaled_location == 1:
        return question.get_inbound_outcome_count()
    return max(
        int(unscaled_location * question.get_inbound_outcome_count() + 1 - 1e-10), 1
    )


def unscaled_location_to_string_location(
    unscaled_location: float, question: Question
) -> str:
    scaled_location = unscaled_location_to_scaled_location(unscaled_location, question)
    return scaled_location_to_string_location(scaled_location, question)


def bucket_index_to_unscaled_location(bucket_index: int, question: Question) -> float:
    if question.type == Question.QuestionType.BINARY:
        return bucket_index
    if question.type == Question.QuestionType.MULTIPLE_CHOICE:
        return bucket_index
    # continuous
    if bucket_index <= 0:
        return -1
    if bucket_index >= question.get_inbound_outcome_count() + 1:
        return 2
    return (bucket_index - 1 / 2) / (question.get_inbound_outcome_count() + 1)


def string_location_to_unscaled_location(
    string_location: str, question: Question
) -> float | None:
    if not string_location or string_location in UnsuccessfulResolutionType:
        return

    scaled_location = string_location_to_scaled_location(string_location, question)
    return scaled_location_to_unscaled_location(scaled_location, question)


def string_location_to_bucket_index(
    string_location: str | None, question: Question
) -> int | None:
    if not string_location or string_location in UnsuccessfulResolutionType:
        return

    unscaled_location = string_location_to_unscaled_location(string_location, question)
    return unscaled_location_to_bucket_index(unscaled_location, question)


def get_scaled_quartiles_from_cdf(cdf: ForecastValues, question: Question):
    from utils.the_math.measures import percent_point_function

    q1 = unscaled_location_to_scaled_location(percent_point_function(cdf, 25), question)
    median = unscaled_location_to_scaled_location(
        percent_point_function(cdf, 50), question
    )
    q3 = unscaled_location_to_scaled_location(percent_point_function(cdf, 75), question)
    return [q1, median, q3]
