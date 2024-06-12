from datetime import timedelta

import numpy as np
from django.utils import timezone

from questions.models import Question
from utils.the_math.community_prediction import (
    compute_multiple_choice_plotable_cp,
    compute_binary_plotable_cp,
    compute_continuous_plotable_cp,
)
from utils.the_math.formulas import string_location_to_bucket_index


def enrich_question_with_resolution_f(
    question: Question, serialized_question: dict
) -> dict:
    serialized_question["resolution"] = question.resolution
    return serialized_question


def enrich_question_with_forecasts_f(
    question: Question, serialized_question: dict
) -> dict:
    """
    Enriches questions with the forecasts object.
    """
    if question.type == "multiple_choice":
        forecasts_data = {
            "timestamps": [],
            "nr_forecasters": [],
        }
        for option in question.options:
            forecasts_data[option] = []
    else:
        forecasts_data = {
            "timestamps": [],
            "values_mean": [],
            "values_max": [],
            "values_min": [],
            "nr_forecasters": [],
        }

    # values_choice_1
    if question.type == "multiple_choice":
        cps = compute_multiple_choice_plotable_cp(question)
        for cp_dict in cps:
            for option, cp in cp_dict.items():
                forecasts_data[option].append(
                    {
                        "value_mean": cp.middle,
                        "value_max": cp.upper,
                        "value_min": cp.lower,
                    }
                )
            forecasts_data["timestamps"].append(
                list(cp_dict.values())[0].at_datetime.timestamp()
            )
            forecasts_data["nr_forecasters"].append(
                list(cp_dict.values())[0].nr_forecasters
            )
    else:
        if question.type == "binary":
            cps = compute_binary_plotable_cp(question)
        elif question.type in ["numeric", "date"]:
            cps = compute_continuous_plotable_cp(question)
        else:
            raise Exception(f"Unknown question type: {question.type}")
        if cps is None or len(cps) == 0:
            return serialized_question

        for cp in cps:
            forecasts_data["timestamps"].append(cp.at_datetime.timestamp())
            forecasts_data["values_mean"].append(cp.middle)
            forecasts_data["values_max"].append(cp.upper)
            forecasts_data["values_min"].append(cp.lower)
            forecasts_data["nr_forecasters"].append(cp.nr_forecasters)

    serialized_question["forecasts"] = forecasts_data
    return serialized_question
