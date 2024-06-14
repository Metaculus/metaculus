from typing import Optional

import numpy as np

from questions.models import Question, GroupOfQuestions, Conditional
from users.models import User
from utils.the_math.community_prediction import (
    compute_multiple_choice_plotable_cp,
    compute_binary_plotable_cp,
    compute_continuous_plotable_cp,
)
from utils.the_math.formulas import scale_location
from utils.the_math.measures import percent_point_function


def build_question_forecasts(
    question: Question, user: Optional[User] = None
) -> dict | None:
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
    if user and not user.is_anonymous:
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
                    scale_location(
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
            if cdf is None or len(cdf) >= 2:
                forecasts_data["latest_pmf"] = np.diff(cdf, prepend=0)
            else:
                forecasts_data["latest_pmf"] = []
        else:
            raise Exception(f"Unknown question type: {question.type}")
        if cps is None or len(cps) == 0:
            return

        for cp in cps:
            forecasts_data["timestamps"].append(cp.at_datetime.timestamp())
            forecasts_data["values_mean"].append(cp.middle)
            forecasts_data["values_max"].append(cp.upper)
            forecasts_data["values_min"].append(cp.lower)
            forecasts_data["nr_forecasters"].append(cp.nr_forecasters)

    return forecasts_data


def create_question(*, title: str = None, **kwargs) -> Question:
    obj = Question(title=title, **kwargs)
    obj.full_clean()
    obj.save()

    return obj


def create_group_of_questions(*, questions: list[dict]) -> GroupOfQuestions:
    obj = GroupOfQuestions()

    obj.full_clean()
    obj.save()

    # Adding questions
    for question_data in questions:
        create_question(group_id=obj.id, **question_data)

    return obj


def create_conditional(
    *, condition_id: int = None, condition_child_id: int = None
) -> Conditional:
    # Auto-generating yes/no questions
    def clone_question(question: Question, title: str = None):
        """
        Avoid auto-cloning to prevent unexpected side effects
        """

        return create_question(
            title=title,
            description=question.description,
            type=question.type,
            possibilities=question.possibilities,
            resolution=question.resolution,
            max=question.max,
            min=question.min,
            zero_point=question.zero_point,
            open_upper_bound=question.open_upper_bound,
            open_lower_bound=question.open_lower_bound,
            options=question.options,
        )

    condition = Question.objects.get(pk=condition_id)
    condition_child = Question.objects.get(pk=condition_child_id)

    obj = Conditional(
        condition_id=condition_id,
        condition_child_id=condition_id,
        # Autogen questions
        question_yes=clone_question(
            condition_child, title=f"{condition.title} (Yes) → {condition_child.title}"
        ),
        question_no=clone_question(
            condition_child, title=f"{condition.title} (No) → {condition_child.title}"
        ),
    )

    obj.full_clean()
    obj.save()

    return obj
