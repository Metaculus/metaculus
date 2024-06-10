from datetime import datetime, timedelta
from typing import Callable

import numpy as np
from django.db.models import QuerySet
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from questions.models import Forecast, Question
from utils.the_math.community_prediction import (
    compute_binary_plotable_cp,
    compute_continuous_plotable_cp,
    compute_multiple_choice_plotable_cp,
)


def enrich_question_with_resolution(
    qs: QuerySet,
) -> tuple[QuerySet, Callable[[Question, dict], dict]]:
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

    def enrich(question: Question, serialized_question: dict):
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
        elif question.type == "number":
            pass

        elif question.type == "date":
            pass

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

    return qs, enrich


def enrich_questions_with_forecasts(
    qs: QuerySet,
) -> tuple[QuerySet, Callable[[Question, dict], dict]]:
    """
    Enriches questions with the forecasts object.
    """

    def enrich(question: Question, serialized_question: dict):
        forecasts_data = {}

        forecasts = question.forecast_set.all()
        forecast_times = []
        end_date = datetime.now().date()
        if question.closed_at and question.closed_at.date() < end_date:
            end_date = question.closed_at.date()
        # TODO: Were this should live: post or object itself?
        if question.published_at:
            forecast_times = [
                question.published_at + timedelta(days=x)
                for x in range((end_date - question.published_at.date()).days + 1)
            ]

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

    return qs, enrich


@api_view(["POST"])
def create_forecast(request):
    data = request.data
    question = Question.objects.get(pk=data["question_id"])
    now = datetime.now()
    prev_forecasts = (
        Forecast.objects.filter(question=question, user=request.user)
        .order_by("start_time")
        .last()
    )
    if prev_forecasts:
        prev_forecasts.end_time = now
        prev_forecasts.save()

    forecast = Forecast.objects.create(
        question=question,
        author=request.user,
        start_time=now,
        end_time=None,
        continuous_cdf=data.get("continuous_cdf", None),
        probability_yes=data.get("probability_yes", None),
        probability_yes_per_category=data.get("probability_yes_per_category", None),
        distribution_components=None,
    )
    forecast.save()

    # Attaching projects to the
    return Response({"id": prev_forecasts.id}, status=status.HTTP_201_CREATED)
