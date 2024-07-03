from datetime import datetime
import numpy as np

from django.utils import timezone
from questions.constants import ResolutionType
from questions.models import Question, GroupOfQuestions, Conditional
from users.models import User
from utils.the_math.community_prediction import (
    compute_multiple_choice_plotable_cp,
    compute_binary_plotable_cp,
    compute_continuous_plotable_cp,
)
from utils.the_math.formulas import scale_location
from utils.the_math.measures import percent_point_function


def build_question_forecasts(question: Question) -> dict | None:
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

    if question.type == "multiple_choice":
        cps = compute_multiple_choice_plotable_cp(question, 100)
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
            cps = compute_binary_plotable_cp(question, 100)
        elif question.type in ["numeric", "date"]:
            cps, cdf = compute_continuous_plotable_cp(question, 100)
            forecasts_data["latest_cdf"] = cdf
            if cdf is not None and len(cdf) >= 2:
                forecasts_data["latest_pmf"] = np.diff(cdf, prepend=0)
            else:
                forecasts_data["latest_pmf"] = []
        else:
            raise Exception(f"Unknown question type: {question.type}")
        if cps is None or len(cps) == 0:
            return forecasts_data

        for cp in cps:
            forecasts_data["timestamps"].append(cp.at_datetime.timestamp())
            forecasts_data["values_mean"].append(cp.middle)
            forecasts_data["values_max"].append(cp.upper)
            forecasts_data["values_min"].append(cp.lower)
            forecasts_data["nr_forecasters"].append(cp.nr_forecasters)

    return forecasts_data


def build_question_forecasts_for_user(question: Question, user: User) -> dict:
    """
    Builds forecasts of a specific user
    """

    forecasts_data = {
        "values_mean": [],
        "timestamps": [],
        "slider_values": None,
    }

    # values_choice_1
    # TODO: fix N+1
    zero_point, max, min = question.zero_point, question.max, question.min
    for x in question.forecast_set.filter(author=user).order_by("start_time").all():
        forecasts_data["slider_values"] = x.slider_values
        forecasts_data["timestamps"].append(x.start_time.timestamp())
        if question.type == "multiple_choice":
            forecasts_data["values_mean"].append(0)
        elif question.type == "binary":
            forecasts_data["values_mean"].append(x.probability_yes)
        elif question.type in ["numeric", "date"]:
            cps, cdf = compute_continuous_plotable_cp(question, 100)
            forecasts_data["values_mean"].append(
                scale_location(
                    zero_point, max, min, percent_point_function(x.continuous_cdf, 0.5)
                )
            )

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
            resolution_set_time=question.resolution_set_time,
            actual_resolve_time=question.actual_resolve_time,
            scheduled_close_time=question.scheduled_close_time,
            scheduled_resolve_time=question.scheduled_resolve_time,
            open_time=question.open_time,
            actual_close_time=question.actual_close_time,
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


def resolve_question(question: Question, resolution, actual_resolve_time: datetime):
    question.resolution = resolution
    question.resolution_set_time = timezone.now()
    question.actual_resolve_time = actual_resolve_time
    if not question.actual_close_time:
        question.actual_close_time = timezone.now()
    question.set_forecast_scoring_ends()
    question.save()

    # Check if the question is part of any/all conditionals
    for conditional in [
        *question.conditional_conditions.all(),
        *question.conditional_children.all(),
    ]:
        if conditional.condition.resolution and conditional.condition_child.resolution:
            if conditional.condition.resolution == "yes":
                resolve_question(conditional.question_no, ResolutionType.ANNULLED)
                resolve_question(
                    conditional.question_yes, conditional.condition_child.resolution
                )
            elif conditional.condition.resolution == "no":
                resolve_question(
                    conditional.question_no, conditional.condition_child.resolution
                )
                resolve_question(conditional.question_yes, ResolutionType.ANNULLED)
            elif conditional.condition.resolution == ResolutionType.ANNULLED:
                resolve_question(conditional.question_no, ResolutionType.ANNULLED)
                resolve_question(
                    conditional.question_yes.resolution, ResolutionType.ANNULLED
                )
            elif conditional.condition.resolution == ResolutionType.AMBIGUOUS:
                resolve_question(
                    conditional.question_no.resolution, ResolutionType.AMBIGUOUS
                )
                resolve_question(
                    conditional.question_yes.resolution, ResolutionType.AMBIGUOUS
                )
            else:
                raise ValueError(
                    f"Invalid resolution for conditionals' condition: {conditional.condition.resolution}"
                )

    post = question.get_post()
    post.update_pseudo_materialized_fields()
    post.save()
