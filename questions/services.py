import logging
from datetime import datetime
from typing import cast

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from posts.models import PostUserSnapshot
from questions.constants import ResolutionType
from questions.models import Question, GroupOfQuestions, Conditional, Forecast
from questions.tasks import resolve_question_and_send_notifications
from users.models import User
from utils.the_math.community_prediction import get_cp_history
from utils.the_math.measures import percent_point_function

logger = logging.getLogger(__name__)


def get_forecast_initial_dict(question: Question) -> dict:
    data = {
        "timestamps": [],
        "nr_forecasters": [],
    }

    if question.type == "multiple_choice":
        for option in question.options:
            data[option] = []
    else:
        data.update(
            {
                "my_forecasts": None,
                "latest_pmf": [],
                "latest_cdf": [],
                "q1s": [],
                "medians": [],
                "q3s": [],
                "means": [],
            }
        )

    return data


def build_question_forecasts(question: Question) -> dict:
    """
    Enriches questions with the forecasts object.
    """
    forecasts_data = get_forecast_initial_dict(question)

    aggregation_history = get_cp_history(question)
    latest_entry = aggregation_history[-1] if aggregation_history else None
    if question.type == "multiple_choice":
        options = cast(list[str], question.options)
        for entry in aggregation_history:
            for i, option in enumerate(options):
                forecasts_data[option].append(
                    {
                        "median": entry.medians[i],
                        "q3": entry.q3s[i],
                        "q1": entry.q1s[i],
                    }
                )
            forecasts_data["timestamps"].append(entry.start_time.timestamp())
            forecasts_data["nr_forecasters"].append(entry.num_forecasters)
        forecasts_data["latest_cdf"] = None
        forecasts_data["latest_pmf"] = (
            None if not latest_entry else list(latest_entry.get_pmf())
        )
    elif question.type == "binary":
        forecasts_data["latest_cdf"] = None
        forecasts_data["latest_pmf"] = (
            None if not latest_entry else list(latest_entry.get_pmf())
        )
        forecasts_data["histogram"] = (
            None
            if (not latest_entry or latest_entry.histogram is None)
            else latest_entry.histogram.tolist()
        )
        if not aggregation_history:
            return forecasts_data

        for entry in aggregation_history:
            forecasts_data["timestamps"].append(entry.start_time.timestamp())
            forecasts_data["q1s"].append(entry.q1s[1])
            forecasts_data["medians"].append(entry.medians[1])
            forecasts_data["q3s"].append(entry.q3s[1])
            forecasts_data["means"].append(entry.means[1])
            forecasts_data["nr_forecasters"].append(entry.num_forecasters)
    elif question.type in ["numeric", "date"]:
        forecasts_data["latest_cdf"] = (
            [] if not aggregation_history else list(latest_entry.continuous_cdf)
        )
        forecasts_data["latest_pmf"] = (
            [] if not aggregation_history else list(latest_entry.get_pmf())
        )
        if not aggregation_history:
            return forecasts_data

        for entry in aggregation_history:
            forecasts_data["timestamps"].append(entry.start_time.timestamp())
            forecasts_data["medians"].append(entry.medians)
            forecasts_data["q3s"].append(entry.q3s)
            forecasts_data["q1s"].append(entry.q1s)
            forecasts_data["nr_forecasters"].append(entry.num_forecasters)
    else:
        raise Exception(f"Unknown question type: {question.type}")

    return forecasts_data


def build_question_forecasts_for_user(
    question: Question, user_forecasts: list[Forecast]
) -> dict:
    """
    Builds forecasts of a specific user
    """

    forecasts_data = {
        "medians": [],
        "timestamps": [],
        "slider_values": None,
    }
    user_forecasts = sorted(user_forecasts, key=lambda x: x.start_time)

    # values_choice_1
    for forecast in user_forecasts:
        forecasts_data["slider_values"] = forecast.slider_values
        forecasts_data["timestamps"].append(forecast.start_time.timestamp())
        if question.type == "multiple_choice":
            forecasts_data["medians"].append(0)
        elif question.type == "binary":
            forecasts_data["medians"].append(forecast.probability_yes)
        elif question.type in ["numeric", "date"]:
            forecasts_data["medians"].append(
                percent_point_function(forecast.continuous_cdf, 50)
            )

    return forecasts_data


def create_question(*, title: str = None, **kwargs) -> Question:
    obj = Question(title=title, **kwargs)
    obj.full_clean()
    obj.save()

    return obj


def create_group_of_questions(
    *, title: str = None, questions: list[dict], **kwargs
) -> GroupOfQuestions:
    obj = GroupOfQuestions(**kwargs)

    obj.full_clean()
    obj.save()

    # Adding questions
    for question_data in questions:
        create_question(group_id=obj.id, **question_data)

    return obj


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
        range_max=question.range_max,
        range_min=question.range_min,
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


def create_conditional(
    *, condition_id: int = None, condition_child_id: int = None
) -> Conditional:
    # Auto-generating yes/no questions

    condition = Question.objects.get(pk=condition_id)
    condition_child = Question.objects.get(pk=condition_child_id)

    obj = Conditional(
        condition_id=condition_id,
        condition_child_id=condition_child_id,
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


@transaction.atomic()
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
                resolve_question(
                    conditional.question_no,
                    ResolutionType.ANNULLED,
                    actual_resolve_time,
                )
                resolve_question(
                    conditional.question_yes,
                    conditional.condition_child.resolution,
                    actual_resolve_time,
                )
            elif conditional.condition.resolution == "no":
                resolve_question(
                    conditional.question_no,
                    conditional.condition_child.resolution,
                    actual_resolve_time,
                )
                resolve_question(
                    conditional.question_yes,
                    ResolutionType.ANNULLED,
                    actual_resolve_time,
                )
            elif conditional.condition.resolution == ResolutionType.ANNULLED:
                resolve_question(
                    conditional.question_no,
                    ResolutionType.ANNULLED,
                    actual_resolve_time,
                )
                resolve_question(
                    conditional.question_yes.resolution,
                    ResolutionType.ANNULLED,
                    actual_resolve_time,
                )
            elif conditional.condition.resolution == ResolutionType.AMBIGUOUS:
                resolve_question(
                    conditional.question_no.resolution,
                    ResolutionType.AMBIGUOUS,
                    actual_resolve_time,
                )
                resolve_question(
                    conditional.question_yes.resolution,
                    ResolutionType.AMBIGUOUS,
                    actual_resolve_time,
                )
            else:
                raise ValueError(
                    f"Invalid resolution for conditionals' condition: {conditional.condition.resolution}"
                )

    post = question.get_post()
    post.update_pseudo_materialized_fields()
    post.save()

    # Calculate scores + notify forecasters
    resolve_question_and_send_notifications.send(question.id)

    if post.resolved:
        from posts.services.common import resolve_post

        try:
            resolve_post(post)
        except Exception:
            logger.exception("Error during post resolving")


def close_question(question: Question):
    if question.actual_close_time:
        raise ValidationError("Question is already closed")

    question.actual_close_time = timezone.now()

    post = question.get_post()
    post.update_pseudo_materialized_fields()
    post.save()

    if post.actual_close_time:
        from posts.services.common import close_post

        close_post(post)


def create_forecast(
    *,
    question: Question = None,
    user: User = None,
    continuous_cdf: list[float] = None,
    probability_yes: float = None,
    probability_yes_per_category: dict[str, float] = None,
    slider_values=None,
    **kwargs,
):
    now = timezone.now()
    post = question.get_post()

    prev_forecasts = (
        Forecast.objects.filter(question=question, author=user)
        .order_by("start_time")
        .last()
    )
    if prev_forecasts:
        prev_forecasts.end_time = now
        prev_forecasts.save()

    probability_yes_per_category_arr = None
    if question.options:
        probability_yes_per_category_arr = []
        for option in question.options:
            probability_yes_per_category_arr.append(
                probability_yes_per_category[option]
            )

    forecast = Forecast.objects.create(
        question=question,
        author=user,
        start_time=now,
        end_time=None,
        continuous_cdf=continuous_cdf,
        probability_yes=probability_yes,
        probability_yes_per_category=probability_yes_per_category_arr,
        distribution_components=None,
        slider_values=slider_values,
        post=post,
    )
    forecast.save()

    # Update cache
    PostUserSnapshot.update_last_forecast_date(question.get_post(), user)
    post.update_forecasts_count()

    # Run async tasks
    from posts.tasks import run_compute_sorting_divergence
    from questions.tasks import run_build_question_forecasts

    run_compute_sorting_divergence.send(post.id)
    run_build_question_forecasts.send(question.id)

    return forecast
