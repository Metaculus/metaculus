import logging
from datetime import datetime

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from notifications.constants import MailingTags
from posts.models import PostUserSnapshot, PostSubscription
from posts.services.subscriptions import create_subscription_cp_change
from projects.permissions import ObjectPermission
from questions.constants import ResolutionType
from questions.models import (
    Question,
    GroupOfQuestions,
    Conditional,
    Forecast,
    AggregateForecast,
)
from questions.types import AggregationMethod
from users.models import User
from utils.the_math.community_prediction import get_cp_history
from utils.the_math.single_aggregation import get_single_aggregation_history
from utils.the_math.measures import percent_point_function

logger = logging.getLogger(__name__)


def get_forecast_initial_dict(question: Question) -> dict:
    data = {
        "timestamps": [],
        "nr_forecasters": [],
        "forecast_values": [],
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


def build_question_forecasts(
    question: Question,
    aggregation_method: str = AggregationMethod.RECENCY_WEIGHTED,
) -> dict:
    """
    Builds the AggregateForecasts for a question
    Stores them in the database
    """
    if aggregation_method == AggregationMethod.SINGLE_AGGREGATION:
        aggregation_history = get_single_aggregation_history(
            question,
            minimize=True,
            include_stats=True,
        )
    else:
        aggregation_history = get_cp_history(
            question,
            aggregation_method=aggregation_method,
            minimize=True,
            include_stats=True,
        )

    # overwrite old history with new history, minimizing the amount deleted and created
    previous_history = question.aggregate_forecasts.filter(method=aggregation_method)
    to_overwrite, to_delete = (
        previous_history[: len(aggregation_history)],
        previous_history[len(aggregation_history) :],
    )
    overwriters, to_create = (
        aggregation_history[: len(to_overwrite)],
        aggregation_history[len(to_overwrite) :],
    )
    for new, old in zip(overwriters, to_overwrite):
        new.id = old.id
    fields = [
        field.name
        for field in AggregateForecast._meta.get_fields()
        if not field.primary_key
    ]
    with transaction.atomic():
        AggregateForecast.objects.bulk_update(overwriters, fields)
        AggregateForecast.objects.filter(id__in=[old.id for old in to_delete]).delete()
        AggregateForecast.objects.bulk_create(to_create)


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
        question.actual_close_time = min(
            actual_resolve_time, question.scheduled_close_time
        )
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
    from questions.tasks import resolve_question_and_send_notifications

    resolve_question_and_send_notifications.send(question.id)

    if post.resolved:
        from posts.services.common import resolve_post

        try:
            resolve_post(post)
        except Exception:
            logger.exception("Error during post resolving")


def close_question(question: Question):
    if question.actual_close_time < timezone.now():
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

    # Auto-subscribe user to CP changes
    if (
        MailingTags.FORECASTED_CP_CHANGE not in user.unsubscribed_mailing_tags
        and not post.subscriptions.filter(
            user=user,
            type=PostSubscription.SubscriptionType.CP_CHANGE,
            is_global=True,
        ).exists()
    ):
        create_subscription_cp_change(
            user=user, post=post, cp_change_threshold=0.1, is_global=True
        )

    # Run async tasks
    from questions.tasks import run_build_question_forecasts

    run_build_question_forecasts.send(question.id)

    return forecast


def create_forecast_bulk(*, user: User = None, forecasts: list[dict] = None):
    from posts.services.common import get_post_permission_for_user
    from posts.tasks import run_on_post_forecast

    posts = set()

    for forecast in forecasts:
        question = forecast.pop("question")
        post = question.get_post()
        posts.add(post)

        # Check permissions
        permission = get_post_permission_for_user(post, user=user)
        ObjectPermission.can_forecast(permission, raise_exception=True)

        if not question.open_time or question.open_time > timezone.now():
            raise ValidationError("You cannot forecast on this question yet!")

        create_forecast(question=question, user=user, **forecast)

    # Running forecast post triggers
    for post in posts:
        run_on_post_forecast.send(post.id)
