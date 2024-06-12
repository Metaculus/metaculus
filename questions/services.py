from datetime import timedelta
from typing import Optional

import numpy as np
from django.utils import timezone

from questions.models import Question
from users.models import User
from utils.the_math.community_prediction import (
    compute_multiple_choice_plotable_cp,
    compute_binary_plotable_cp,
    compute_continuous_plotable_cp,
)
from utils.the_math.formulas import scale_continous_forecast_location
from utils.the_math.measures import percent_point_function


def enrich_question_with_resolution_f(
    question: Question, serialized_question: dict
) -> dict:
    """
    resolution of -2 means "annulled"
    resolution of -1 means "ambiguous"
    For Binary
    resolution of 0 means "didn't happen"
    resolution of 1 means "did happen"
    For MC
    resolution of N means "N'th choice occurred"
    resolved_option is a mapping to the Option that was resolved to
    For Continuous
    resolution of 0 means "at lower bound"
    resolution of 1 means "at upper bound"
    resolution in [0, 1] means "resolved at some specified location within bounds"
    resolution of 2 means "not greater than lower bound"
    resolution of 3 means "not less than upper bound"
    """

    if question.resolution is None:
        return serialized_question

    if question.type == "binary":
        # TODO: @george, some questions might have None resolution, so this leads to error
        #   added tmp condition to prevent such cases
        resolution = serialized_question["resolution"]

        if resolution is not None:
            if np.isclose(float(serialized_question["resolution"]), 0):
                serialized_question["resolution"] = "Yes"
            elif np.isclose(float(serialized_question["resolution"]), -1):
                serialized_question["resolution"] = "No"

    # TODO @Luke this and the date have to be normalized
    elif question.type == "numeric":
        serialized_question["resolution"] = scale_continous_forecast_location(
            question, int(float(question.resolution) * 200)
        )
    elif question.type == "date":
        serialized_question["resolution"] = scale_continous_forecast_location(
            question, int(float(question.resolution) * 200)
        )

    elif question.type == "multiple_choice":
        try:
            serialized_question["resolution"] = question.options[
                int(question.resolution)
            ]
        except Exception:
            serialized_question["resolution"] = (
                f"Error for resolution: {question.resolution}"
            )
    else:
        pass

    return serialized_question


def enrich_question_with_forecasts_f(
    question: Question, serialized_question: dict, user: Optional[User]
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
            "my_forecasts": None,
            "latest_pmf": [],
            "latest_cdf": [],
        }

    # values_choice_1
    if not user.is_anonymous:
        forecasts_data["my_forecasts"] = {
            "values_mean": [],
            "timestamps": [],
        }
        for x in question.forecast_set.filter(author=user).order_by("start_time").all():
            forecasts_data["my_forecasts"]["slider_values"] = x.slider_values
            forecasts_data["my_forecasts"]["timestamps"].append(
                x.start_time.timestamp()
            )
            if question.type == "multiple_choice":
                forecasts_data["my_forecasts"]["values_mean"].append(0)
            elif question.type == "binary":
                forecasts_data["my_forecasts"]["values_mean"].append(x.probability_yes)
            elif question.type in ["numeric", "date"]:
                cps, cdf = compute_continuous_plotable_cp(question)
                forecasts_data["my_forecasts"]["values_mean"].append(
                    scale_continous_forecast_location(
                        question, percent_point_function(x.continuous_cdf, 0.5)
                    )
                )

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
            cps, cdf = compute_continuous_plotable_cp(question)
            forecasts_data["latest_cdf"] = cdf
            forecasts_data["latest_pmf"] = np.diff(cdf, prepend=0)
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
