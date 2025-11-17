import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import cast, Iterable

import sentry_sdk
from django.db import transaction
from django.db.models import F, Q, QuerySet, Subquery, OuterRef, Count
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from coherence.models import CoherenceLink
from notifications.constants import MailingTags
from notifications.services import delete_scheduled_question_resolution_notifications
from posts.models import PostUserSnapshot, PostSubscription, Notebook, Post
from posts.services.subscriptions import (
    create_subscription_cp_change,
    notify_post_status_change,
)
from posts.tasks import run_on_post_forecast
from projects.models import Project
from projects.services.cache import invalidate_projects_questions_count_cache
from projects.services.subscriptions import notify_project_subscriptions_post_open
from questions.cache import average_coverage_cache_key
from questions.constants import UnsuccessfulResolutionType, QuestionStatus
from questions.models import (
    QUESTION_CONTINUOUS_TYPES,
    Question,
    GroupOfQuestions,
    Conditional,
    Forecast,
    AggregateForecast,
    UserForecastNotification,
)
from questions.serializers.common import serialize_question_movement
from questions.types import AggregationMethod, QuestionMovement
from questions.utils import (
    get_question_movement_period,
    get_last_forecast_in_the_past,
)
from scoring.constants import ScoreTypes, LeaderboardScoreTypes
from scoring.models import Leaderboard, Score
from scoring.utils import score_question, update_project_leaderboard
from users.models import User
from utils.cache import cache_per_object
from utils.db import transaction_repeatable_read
from utils.dtypes import flatten
from utils.models import model_update
from utils.the_math.aggregations import (
    get_aggregation_history,
    get_aggregations_at_time,
)
from utils.the_math.formulas import unscaled_location_to_scaled_location
from utils.the_math.measures import (
    percent_point_function,
    prediction_difference_for_sorting,
)

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
    aggregation_method: AggregationMethod | None = None,
):
    """
    Builds the AggregateForecasts for a question
    Stores them in the database
    """
    aggregation_method = aggregation_method or question.default_aggregation_method
    aggregation_history = get_aggregation_history(
        question,
        aggregation_methods=[aggregation_method],
        minimize=True,
        include_bots=question.include_bots_in_aggregates,
        include_stats=True,
    )[aggregation_method]

    with transaction.atomic():
        # overwrite old history with new history, minimizing the amount deleted and created
        previous_history = list(
            question.aggregate_forecasts.filter(method=aggregation_method).order_by(
                "start_time"
            )
        )
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
        AggregateForecast.objects.bulk_update(overwriters, fields, batch_size=50)
        AggregateForecast.objects.filter(id__in=[old.id for old in to_delete]).delete()
        AggregateForecast.objects.bulk_create(to_create, batch_size=50)


def build_question_forecasts_for_user(
    question: Question, user_forecasts: list[Forecast]
) -> dict:
    """
    Builds forecasts of a specific user
    """

    forecasts_data = {
        "medians": [],
        "timestamps": [],
        "distribution_input": None,
    }
    user_forecasts = sorted(user_forecasts, key=lambda x: x.start_time)

    # values_choice_1
    for forecast in user_forecasts:
        forecasts_data["distribution_input"] = forecast.distribution_input
        forecasts_data["timestamps"].append(forecast.start_time.timestamp())
        if question.type == "multiple_choice":
            forecasts_data["medians"].append(0)
        elif question.type == "binary":
            forecasts_data["medians"].append(forecast.probability_yes)
        elif question.type in QUESTION_CONTINUOUS_TYPES:
            forecasts_data["medians"].append(
                percent_point_function(forecast.continuous_cdf, 50)
            )

    return forecasts_data


def compute_question_movement(question: Question) -> float | None:
    now = timezone.now()

    cp_now = get_aggregations_at_time(
        question, now, [question.default_aggregation_method]
    ).get(question.default_aggregation_method)

    if not cp_now:
        return

    cp_previous = get_aggregations_at_time(
        question,
        now - get_question_movement_period(question),
        [question.default_aggregation_method],
    ).get(question.default_aggregation_method)

    if not cp_previous:
        return

    return prediction_difference_for_sorting(
        cp_now.get_prediction_values(),
        cp_previous.get_prediction_values(),
        question.type,
    )


def create_question(*, title: str = None, **kwargs) -> Question:
    obj = Question(title=title, **kwargs)
    obj.full_clean()
    obj.save()

    return obj


def update_question(question: Question, **kwargs) -> Question:
    scheduled_close_time = kwargs.get("scheduled_close_time")

    question, _ = model_update(
        instance=question,
        data=kwargs,
    )

    # Remove actual close time on value change
    if scheduled_close_time and scheduled_close_time > timezone.now():
        question.actual_close_time = None
        question.save()

    return question


def create_group_of_questions(*, questions: list[dict], **kwargs) -> GroupOfQuestions:
    obj = GroupOfQuestions(**kwargs)

    obj.full_clean()
    obj.save()

    # Adding questions
    for question_data in questions:
        create_question(group_id=obj.id, **question_data)

    return obj


def update_group_of_questions(
    group: GroupOfQuestions,
    delete: list[int] = None,
    questions: list[dict] = None,
    **kwargs,
) -> GroupOfQuestions:
    questions = questions or []
    questions_map = {q.pk: q for q in group.questions.all()}

    group, _ = model_update(
        instance=group,
        fields=[
            "fine_print",
            "resolution_criteria",
            "description",
            "group_variable",
            "subquestions_order",
            "graph_type",
        ],
        data=kwargs,
    )

    # Deleting questions
    if delete:
        group.questions.filter(id__in=delete).delete()

    for question_data in questions:
        question_id = question_data.get("id")

        if question_id:
            question_obj = questions_map.get(question_id)

            if not question_obj:
                raise ValueError("Question ID does not exist for this group")

            update_question(question_obj, **question_data)
        else:
            create_question(group_id=group.id, **question_data)

    group.save()
    return group


def clone_question(question: Question, title: str = None, **kwargs) -> Question:
    """
    Avoid auto-cloning to prevent unexpected side effects
    """

    return create_question(
        title=title,
        description=kwargs.pop("description", question.description),
        type=kwargs.pop("type", question.type),
        possibilities=kwargs.pop("possibilities", question.possibilities),
        resolution=kwargs.pop("resolution", question.resolution),
        range_max=kwargs.pop("range_max", question.range_max),
        range_min=kwargs.pop("range_min", question.range_min),
        zero_point=kwargs.pop("zero_point", question.zero_point),
        open_upper_bound=kwargs.pop("open_upper_bound", question.open_upper_bound),
        open_lower_bound=kwargs.pop("open_lower_bound", question.open_lower_bound),
        inbound_outcome_count=kwargs.pop(
            "inbound_outcome_count", question.inbound_outcome_count
        ),
        options=kwargs.pop("options", question.options),
        group_variable=kwargs.pop("group_variable", question.group_variable),
        resolution_set_time=kwargs.pop(
            "resolution_set_time", question.resolution_set_time
        ),
        actual_resolve_time=kwargs.pop(
            "actual_resolve_time", question.actual_resolve_time
        ),
        scheduled_close_time=kwargs.pop(
            "scheduled_close_time", question.scheduled_close_time
        ),
        scheduled_resolve_time=kwargs.pop(
            "scheduled_resolve_time", question.scheduled_resolve_time
        ),
        open_time=kwargs.pop("open_time", question.open_time),
        actual_close_time=kwargs.pop("actual_close_time", question.actual_close_time),
        unit=kwargs.pop("unit", question.unit),
        **kwargs,
    )


def create_conditional(
    *, condition_id: int = None, condition_child_id: int = None
) -> Conditional:
    # Auto-generating yes/no questions

    # TODO: select only questions user has access to (public only)
    condition = Question.objects.get(pk=condition_id)
    condition_child = Question.objects.get(pk=condition_child_id)

    question_yes = clone_question(
        condition_child,
        title=f"{condition.title} (Yes) → {condition_child.title}",
        scheduled_close_time=min(
            condition.scheduled_close_time, condition_child.scheduled_close_time
        ),
    )
    question_no = clone_question(
        condition_child,
        title=f"{condition.title} (No) → {condition_child.title}",
        scheduled_close_time=min(
            condition.scheduled_close_time, condition_child.scheduled_close_time
        ),
    )

    obj = Conditional(
        condition_id=condition_id,
        condition_child_id=condition_child_id,
        question_yes=question_yes,
        question_no=question_no,
    )

    obj.full_clean()
    obj.save()

    return obj


def update_conditional(
    obj: Conditional, condition_id: int = None, condition_child_id: int = None
) -> Conditional:
    post = obj.post

    # TODO: select only questions user has access to (public only)
    condition = (
        Question.objects.get(pk=condition_id)
        if condition_id != obj.condition_id
        else None
    )
    condition_child = (
        Question.objects.get(pk=condition_child_id)
        if condition_child_id != obj.condition_child_id
        else None
    )

    if condition or condition_child:
        if condition:
            obj.condition = condition
        if condition_child:
            obj.condition_child = condition_child
            # Update post short_title from condition child
            post.short_title = condition_child.get_post().get_short_title()
            post.save(update_fields=["short_title"])

        title = f"{obj.condition.title} (%s) → {obj.condition_child.title}"

        question_yes = clone_question(condition_child, title=title % "Yes")
        question_yes.save()
        obj.question_yes = question_yes

        question_no = clone_question(condition_child, title=title % "No")
        question_no.save()
        obj.question_no = question_no

    obj.save()
    return obj


def update_notebook(notebook: Notebook, **kwargs):
    notebook, _ = model_update(
        instance=notebook,
        fields=[
            "markdown",
            "type",
            "image_url",
        ],
        data=kwargs,
    )

    return notebook


@transaction.atomic()
def resolve_question(
    question: Question,
    resolution: str,
    actual_resolve_time: datetime,
):
    question.resolution = resolution
    question.resolution_set_time = timezone.now()
    question.actual_resolve_time = actual_resolve_time
    question.actual_close_time = min(actual_resolve_time, question.scheduled_close_time)
    question.save()

    # deal with related conditionals
    conditional: Conditional
    for conditional in [
        *question.conditional_conditions.all(),
        *question.conditional_children.all(),
    ]:
        condition = conditional.condition
        child = conditional.condition_child
        if question == condition:
            # handle annulment
            if question.resolution in [
                UnsuccessfulResolutionType.ANNULLED,
                UnsuccessfulResolutionType.AMBIGUOUS,
            ]:
                resolve_question(
                    conditional.question_no,
                    UnsuccessfulResolutionType.ANNULLED,
                    actual_resolve_time,
                )
                resolve_question(
                    conditional.question_yes,
                    UnsuccessfulResolutionType.ANNULLED,
                    actual_resolve_time,
                )
            if child.resolution is None:
                if question.resolution == "yes":
                    resolve_question(
                        conditional.question_no,
                        UnsuccessfulResolutionType.ANNULLED,
                        actual_resolve_time,
                    )
                    close_question(
                        conditional.question_yes,
                        actual_close_time=question.actual_close_time,
                    )
                if question.resolution == "no":
                    resolve_question(
                        conditional.question_yes,
                        UnsuccessfulResolutionType.ANNULLED,
                        actual_resolve_time,
                    )
                    close_question(
                        conditional.question_no,
                        actual_close_time=question.actual_close_time,
                    )
            # if the child is already successfully resolved,
            # we resolve the active branch and annull the other
            if child.resolution not in [
                None,
                UnsuccessfulResolutionType.ANNULLED,
                UnsuccessfulResolutionType.AMBIGUOUS,
            ]:
                if question.resolution == "yes":
                    resolve_question(
                        conditional.question_yes,
                        child.resolution,
                        conditional.question_yes.scheduled_close_time,
                    )
                    resolve_question(
                        conditional.question_no,
                        UnsuccessfulResolutionType.ANNULLED,
                        conditional.question_no.scheduled_close_time,
                    )
                if question.resolution == "no":
                    resolve_question(
                        conditional.question_no,
                        child.resolution,
                        conditional.question_no.scheduled_close_time,
                    )
                    resolve_question(
                        conditional.question_yes,
                        UnsuccessfulResolutionType.ANNULLED,
                        conditional.question_yes.scheduled_close_time,
                    )
        else:  # question == child
            # handle annulment / ambiguity
            if question.resolution in [
                UnsuccessfulResolutionType.ANNULLED,
                UnsuccessfulResolutionType.AMBIGUOUS,
            ]:
                resolve_question(
                    conditional.question_yes,
                    UnsuccessfulResolutionType.ANNULLED,
                    actual_resolve_time,
                )
                resolve_question(
                    conditional.question_no,
                    UnsuccessfulResolutionType.ANNULLED,
                    actual_resolve_time,
                )
            else:  # child is successfully resolved
                if condition.resolution is None:
                    # condition is not resolved
                    # both branches need to close
                    close_question(
                        conditional.question_no,
                        actual_close_time=question.actual_close_time,
                    )
                    close_question(
                        conditional.question_yes,
                        actual_close_time=question.actual_close_time,
                    )
                else:  # condition is already resolved,
                    # resolve the active branch
                    if condition.resolution == "yes":
                        resolve_question(
                            conditional.question_yes,
                            question.resolution,
                            conditional.question_yes.scheduled_close_time,
                        )
                    if condition.resolution == "no":
                        resolve_question(
                            conditional.question_no,
                            question.resolution,
                            conditional.question_no.scheduled_close_time,
                        )

    post = question.get_post()
    post.update_pseudo_materialized_fields()
    from posts.services.common import update_global_leaderboard_tags

    update_global_leaderboard_tags(post)
    post.save()

    # Invalidate project questions count cache since resolution affects visibility
    invalidate_projects_questions_count_cache(post.get_related_projects())

    # Calculate scores + notify forecasters
    from questions.tasks import resolve_question_and_send_notifications

    resolve_question_and_send_notifications.send(question.id)


@transaction.atomic()
def unresolve_question(question: Question):
    question.resolution = None
    question.resolution_set_time = None
    question.actual_resolve_time = None
    question.actual_close_time = (
        None
        if timezone.now() < question.scheduled_close_time
        else question.scheduled_close_time
    )
    question.save()

    # Delete already scheduled resolution notifications
    delete_scheduled_question_resolution_notifications(question)

    # Check if the question is part of any/all conditionals
    conditional: Conditional
    for conditional in [
        *question.conditional_conditions.all(),
        *question.conditional_children.all(),
    ]:
        condition = conditional.condition
        child = conditional.condition_child
        if question == condition:
            if child.resolution not in [
                UnsuccessfulResolutionType.ANNULLED,
                UnsuccessfulResolutionType.AMBIGUOUS,
            ]:
                # unresolve both branches (handles annulment / ambiguity automatically)
                unresolve_question(conditional.question_yes)
                unresolve_question(conditional.question_no)
            if child.resolution not in [
                None,
                UnsuccessfulResolutionType.ANNULLED,
                UnsuccessfulResolutionType.AMBIGUOUS,
            ]:
                # both branches should still be closed though
                close_question(
                    conditional.question_yes, actual_close_time=child.actual_close_time
                )
                close_question(
                    conditional.question_no, actual_close_time=child.actual_close_time
                )
        if question == child:
            if condition.resolution is None:
                # unresolve both branches (handles annulment / ambiguity automatically)
                unresolve_question(conditional.question_yes)
                unresolve_question(conditional.question_no)
            if condition.resolution == "yes":
                unresolve_question(conditional.question_yes)
                close_question(
                    conditional.question_yes,
                    actual_close_time=condition.actual_close_time,
                )
            if condition.resolution == "no":
                unresolve_question(conditional.question_no)
                close_question(
                    conditional.question_no,
                    actual_close_time=condition.actual_close_time,
                )

    post = question.get_post()
    post.update_pseudo_materialized_fields()
    from posts.services.common import update_global_leaderboard_tags

    update_global_leaderboard_tags(post)
    post.save()

    # TODO: set up unresolution notifications
    # in the "resolve_question" function, scoring is handled in the same task
    # as notifications. So this should be moved in the same way after notifications
    # are generated
    # scoring
    score_types = [
        ScoreTypes.BASELINE,
        ScoreTypes.PEER,
        ScoreTypes.RELATIVE_LEGACY,
    ]
    spot_scoring_time = question.get_spot_scoring_time()
    if spot_scoring_time:
        score_types.append(ScoreTypes.SPOT_PEER)
        score_types.append(ScoreTypes.SPOT_BASELINE)
    score_question(
        question,
        None,  # None is the equivalent of unsetting scores
        spot_scoring_time=spot_scoring_time,
        score_types=score_types,
    )

    # Update leaderboards
    update_leaderboards_for_question(question)

    # Rebuild question aggregations
    build_question_forecasts(question)


def close_question(question: Question, actual_close_time: datetime | None = None):
    now = timezone.now()
    question.actual_close_time = min(
        question.actual_close_time or now,
        actual_close_time or now,
        question.scheduled_close_time,
        question.actual_resolve_time or now,
    )
    question.save()

    post = question.get_post()
    # This method automatically sets post closure
    # Based on child questions
    post.update_pseudo_materialized_fields()
    from posts.services.common import update_global_leaderboard_tags

    update_global_leaderboard_tags(post)
    post.save()

    # Cancel notifications which have a trigger time after the new actual_close_time
    # or for forecasts with an end_time after the new actual_close_time
    UserForecastNotification.objects.filter(question=question).filter(
        Q(trigger_time__gt=question.actual_close_time)
        | Q(forecast__end_time__gt=question.actual_close_time)
    ).delete()


def update_leaderboards_for_question(question: Question):
    post = question.get_post()
    projects = [post.default_project] + list(post.projects.all())
    update_global_leaderboards = False
    for project in projects:
        if project.visibility == Project.Visibility.NORMAL:
            update_global_leaderboards = True

        if project.type == Project.ProjectTypes.SITE_MAIN:
            # global leaderboards handled separately
            continue

        leaderboards = project.leaderboards.all()
        for leaderboard in leaderboards:
            update_project_leaderboard(project, leaderboard)

    if update_global_leaderboards:
        global_leaderboard_window = question.get_global_leaderboard_dates()
        if global_leaderboard_window is not None:
            global_leaderboards = Leaderboard.objects.filter(
                project__type=Project.ProjectTypes.SITE_MAIN,
                start_time=global_leaderboard_window[0],
                end_time=global_leaderboard_window[1],
            ).exclude(
                score_type__in=[
                    LeaderboardScoreTypes.COMMENT_INSIGHT,
                    LeaderboardScoreTypes.QUESTION_WRITING,
                ]
            )
            for leaderboard in global_leaderboards:
                update_project_leaderboard(leaderboard=leaderboard)


def create_forecast(
    *,
    question: Question = None,
    user: User = None,
    continuous_cdf: list[float] = None,
    probability_yes: float = None,
    probability_yes_per_category: list[float] = None,
    distribution_input=None,
    **kwargs,
):
    now = timezone.now()
    post = question.get_post()

    forecast = Forecast.objects.create(
        question=question,
        author=user,
        start_time=now,
        continuous_cdf=continuous_cdf,
        probability_yes=probability_yes,
        probability_yes_per_category=probability_yes_per_category,
        distribution_input=(
            distribution_input if question.type in QUESTION_CONTINUOUS_TYPES else None
        ),
        post=post,
        **kwargs,
    )
    # tidy up all forecasts
    # go backwards through time and make sure end_time isn't none for any forecast other
    # than the last one, and there aren't any invalid end_times
    user_forecasts = list(
        Forecast.objects.filter(
            question=question,
            author=user,
        )
        .only("start_time", "end_time")
        .order_by("-start_time")
    )
    if len(user_forecasts) > 1:
        next_forecast = user_forecasts[0]
        for previous_forecast in user_forecasts[1:]:
            if (
                previous_forecast.end_time is None
                or previous_forecast.end_time > next_forecast.start_time
            ):
                previous_forecast.end_time = next_forecast.start_time
                previous_forecast.save()
            next_forecast = previous_forecast

    return forecast


def after_forecast_actions(question: Question, user: User):
    post = question.get_post()

    # Update cache
    PostUserSnapshot.update_last_forecast_date(post, user)
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


def create_forecast_bulk(*, user: User = None, forecasts: list[dict] = None):
    posts = set()

    for forecast in forecasts:
        question = forecast.pop("question")
        post = question.get_post()
        posts.add(post)

        forecast = create_forecast(question=question, user=user, **forecast)
        update_forecast_notification(forecast=forecast, created=True)
        after_forecast_actions(question, user)

    # Update counters
    for post in posts:
        # There may be situations where async jobs from `create_forecast` complete after
        # `run_on_post_forecast` is triggered. To maintain the correct sequence of execution,
        # we need to ensure that `run_on_post_forecast` runs only after all forecasts have been processed.
        #
        # As a temporary solution, we introduce a 10-second delay before execution
        # to ensure all forecasts are processed.
        run_on_post_forecast.send_with_options(args=(post.id,), delay=10_000)


def withdraw_forecast_bulk(user: User = None, withdrawals: list[dict] = None):
    posts = set()

    for withdrawal in withdrawals:
        question = cast(Question, withdrawal["question"])
        post = question.get_post()
        posts.add(post)

        withdraw_at = withdrawal["withdraw_at"]

        # withdraw standing prediction at withdraw_at time, and delete any
        # forecasts set after that time (this is to future proof from
        # preregistering forecasts)
        user_forecasts = question.user_forecasts.filter(
            Q(end_time__isnull=True) | Q(end_time__gt=withdraw_at),
            author=user,
        ).order_by("start_time")

        if not user_forecasts.exists():
            raise ValidationError(
                f"User {user.id} has no forecast at {withdraw_at} to "
                f"withdraw for question {question.id}"
            )

        forecast_to_terminate = user_forecasts.first()
        forecast_to_terminate.end_time = withdraw_at
        forecast_to_terminate.save()
        forecasts_to_delete = user_forecasts.exclude(pk=forecast_to_terminate.pk)
        update_forecast_notification(forecast=forecast_to_terminate, created=False)
        forecasts_to_delete.delete()

        after_forecast_actions(question, user)

        # remove global subscriptions
        PostSubscription.objects.filter(
            user=user,
            post=post,
            type=PostSubscription.SubscriptionType.CP_CHANGE,
            is_global=True,
        ).delete()

    for post in posts:
        # There may be situations where async jobs from `create_forecast` complete after
        # `run_on_post_forecast` is triggered. To maintain the correct sequence of execution,
        # we need to ensure that `run_on_post_forecast` runs only after all forecasts have been processed.
        #
        # As a temporary solution, we introduce a 10-second delay before execution
        # to ensure all forecasts are processed.
        run_on_post_forecast.send_with_options(args=(post.id,), delay=10_000)


def update_forecast_notification(
    forecast: Forecast,
    created: bool,
):
    """
    Creates or deletes UserForecastNotification objects based on forecast lifecycle.

    When created=True: Creates/updates notification if forecast has future end_time
    When created=False: Deletes existing notification for user/question pair
    """

    user = forecast.author
    question = forecast.question

    # Delete existing notification
    UserForecastNotification.objects.filter(user=user, question=question).delete()

    if created:
        # Calculate total lifetime of the forecast
        start_time = forecast.start_time
        end_time = (
            forecast.end_time or start_time
        )  # If end_time is None, same case as duration 0 -> no notification
        total_lifetime = end_time - start_time

        if (
            forecast.end_time is not None
            and question.scheduled_close_time is not None
            and forecast.end_time >= question.scheduled_close_time
        ):
            # If the forecast.end_time is after the question.scheduled_close_time,
            # don't create a notification
            return

        # Determine trigger time based on lifetime
        if total_lifetime < timedelta(hours=8):
            return
        elif total_lifetime > timedelta(weeks=3):
            # If lifetime > 3 weeks, trigger 1 week before end
            trigger_time = end_time - timedelta(weeks=1)
        else:
            # Otherwise, trigger 1 day before end
            trigger_time = end_time - timedelta(days=1)

        # Create or update the notification
        UserForecastNotification.objects.update_or_create(
            user=user,
            question=question,
            defaults={
                "trigger_time": trigger_time,
                "email_sent": False,
                "forecast": forecast,
            },
        )


@sentry_sdk.trace
def get_questions_cutoff(
    questions: Iterable[Question], group_cutoff: int | None = None
):
    if not group_cutoff:
        return questions

    qs = (
        AggregateForecast.objects.filter(
            question__in=questions, method=F("question__default_aggregation_method")
        )
        .filter(
            (Q(end_time__isnull=True) | Q(end_time__gt=timezone.now())),
            start_time__lte=timezone.now(),
        )
        .order_by("question_id", "-start_time")
        .distinct("question_id")
        .values_list("question_id", "centers")
    )
    aggregations = dict(qs)
    grouped = defaultdict(list)

    for q in questions:
        if (
            q.group_id
            and q.group.graph_type
            != GroupOfQuestions.GroupOfQuestionsGraphType.FAN_GRAPH
        ):
            grouped[q.group].append(q)

    def rank_sorting_key(q: Question):
        return q.group_rank or 0

    def cp_sorting_key(q: Question):
        """
        Extracts question aggregation forecast value
        """
        centers = aggregations.get(q.id)

        if not centers:
            return 0
        if q.type == "binary":
            if len(centers) < 2:
                return 0

            return centers[1]
        if q.type in QUESTION_CONTINUOUS_TYPES:
            return unscaled_location_to_scaled_location(centers[0], q)
        if q.type == "multiple_choice":
            return max(centers)
        return 0

    cutoff_excluded = {
        q
        for group, qs in grouped.items()
        for q in sorted(
            qs,
            key=(
                rank_sorting_key
                if group.subquestions_order
                == GroupOfQuestions.GroupOfQuestionsSubquestionsOrder.MANUAL
                else cp_sorting_key
            ),
            reverse=(
                group.subquestions_order
                == GroupOfQuestions.GroupOfQuestionsSubquestionsOrder.CP_DESC
            ),
        )[group_cutoff:]
    }

    return set(questions) - cutoff_excluded


def get_last_aggregated_forecasts_for_questions(
    questions: Iterable[Question], aggregated_forecast_qs: QuerySet[AggregateForecast]
):
    return (
        aggregated_forecast_qs.filter(question__in=questions)
        .filter(
            (Q(end_time__isnull=True) | Q(end_time__gt=timezone.now())),
            start_time__lte=timezone.now(),
        )
        .order_by("question_id", "method", "-start_time")
        .distinct("question_id", "method")
    )


@sentry_sdk.trace
def get_aggregated_forecasts_for_questions(
    questions: Iterable[Question],
    group_cutoff: int = None,
    aggregated_forecast_qs: QuerySet[AggregateForecast] | None = None,
    include_cp_history: bool = False,
):
    """
    Extracts aggregated forecasts for the given questions.

    @param questions: questions to generate forecasts for
    @param group_cutoff: generated forecasts for the top first N questions of the group
    @param aggregated_forecast_qs: Optional initial AggregateForecast queryset
    """

    # Copy questions list
    questions = list(questions)
    question_map = {q.pk: q for q in questions}
    if aggregated_forecast_qs is None:
        aggregated_forecast_qs = AggregateForecast.objects.all()

    questions_to_fetch = get_questions_cutoff(questions, group_cutoff=group_cutoff)

    aggregated_forecasts = set(
        get_last_aggregated_forecasts_for_questions(questions, aggregated_forecast_qs)
    )

    if include_cp_history:
        # Fetch full aggregation history with lightweight objects
        aggregated_forecasts |= set(
            aggregated_forecast_qs.filter(question__in=questions_to_fetch)
            .filter(start_time__lte=timezone.now())
            .exclude(pk__in=[x.id for x in aggregated_forecasts])
            .defer("forecast_values", "histogram", "means")
        )

    forecasts_by_question = defaultdict(list)
    for forecast in sorted(aggregated_forecasts, key=lambda f: f.start_time):
        forecasts_by_question[question_map[forecast.question_id]].append(forecast)

    return forecasts_by_question


def get_user_last_forecasts_map(
    questions: Iterable[Question], user: User
) -> dict[Question, Forecast]:
    qs = Forecast.objects.filter(
        author=user,
        question__in=questions,
        id=Subquery(
            Forecast.objects.filter(
                author=user,
                question_id=OuterRef("question_id"),
            )
            .order_by("-start_time", "-id")
            .values("id")[:1]
        ),
    )
    question_id_map = {x.question_id: x for x in qs}

    return {q: question_id_map.get(q.id) for q in questions}


def calculate_period_movement_for_questions(
    questions: Iterable[Question],
    compare_periods_map: dict[Question, timedelta],
    threshold: float = 0.25,
) -> dict[Question, QuestionMovement | None]:
    """
    Calculate, for each question, how much forecast has moved
    between the user last forecasting date and the latest aggregate forecasts.
    """

    question_movement_map: dict[Question, QuestionMovement | None] = {
        q: None for q in questions
    }

    # Run this block at REPEATABLE READ isolation level to prevent race conditions.
    # We first perform a lightweight query fetching only id, start_time, and end_time
    # of AggregateForecast to identify the relevant rows, then re-fetch
    # the full data for those IDs. Without a stable snapshot, records might disappear
    # mid-process (e.g. due to concurrent CP recalculation), causing missing data errors.
    # REPEATABLE READ ensures both SELECTs see the same MVCC snapshot and avoids this race.
    with transaction_repeatable_read():
        # Step 1: Fetch aggregated forecasts with deferred `forecast_values` field.
        # We do this to significantly reduce data transfer size and Django model instance serialization time,
        # because the `forecast_values` object can be quite large.
        question_aggregated_forecasts_map = get_aggregated_forecasts_for_questions(
            # Only forecasted questions
            compare_periods_map.keys(),
            aggregated_forecast_qs=(
                AggregateForecast.objects.filter_default_aggregation().only(
                    "id", "start_time", "question_id", "end_time"
                )
            ),
            include_cp_history=True,
        )

        agg_id_map: dict[Question, tuple[int, int]] = {}
        now = timezone.now()

        # Step 2: find First and Last AggregateForecast for each question
        for question in questions:
            delta = compare_periods_map.get(question)
            aggregated_forecasts = question_aggregated_forecasts_map.get(question)

            if not delta or not aggregated_forecasts:
                continue

            from_date = now - delta

            # Skip hidden CP
            if question.is_cp_hidden:
                continue

            last_agg = get_last_forecast_in_the_past(aggregated_forecasts)
            first_agg = (
                next(
                    (
                        agg
                        for agg in aggregated_forecasts
                        if agg.start_time <= from_date
                        and agg.start_time <= now
                        and (agg.end_time is None or agg.end_time > from_date)
                    ),
                    None,
                )
                or last_agg
            )

            # This is possible if question has gaps the in forecasting timeline
            if not last_agg or not first_agg:
                continue

            agg_id_map[question] = (first_agg.id, last_agg.id)

        # 3) Bulk‐fetch full forecasts for just those IDs
        full_aggs = {
            x.id: x
            for x in AggregateForecast.objects.filter(
                pk__in=flatten(agg_id_map.values())
            )
        }

    # 4) Compute and return the movement per question
    for question, (first_id, last_id) in agg_id_map.items():
        f1 = full_aggs[first_id]
        f2 = full_aggs[last_id]
        period = compare_periods_map.get(question)

        question_movement_map[question] = serialize_question_movement(
            question, f1, f2, period, threshold=threshold
        )

    return question_movement_map


@sentry_sdk.trace
@cache_per_object(timeout=60 * 10)
def calculate_movement_for_questions(
    questions: Iterable[Question],
) -> dict[Question, QuestionMovement | None]:
    """
    Generates question movement based on its lifetime
    """

    now = timezone.now()
    questions = [
        q
        for q in questions
        # Our max movement period is 7 days, so we want to skip other questions
        if (not q.actual_close_time or now - q.actual_close_time <= timedelta(days=7))
        # We don't want to calculate movement for groups right now
        and not q.group_id
    ]

    return calculate_period_movement_for_questions(
        questions,
        {q: get_question_movement_period(q) for q in questions if q.open_time},
        threshold=0,
    )


def handle_question_open(question: Question):
    """
    A specific handler is triggered once it's opened
    """

    post = question.get_post()

    # Handle post subscriptions
    notify_post_status_change(post, Post.PostStatusChange.OPEN, question=question)

    # Handle question on followed projects subscriptions
    notify_project_subscriptions_post_open(post, question=question)


def get_forecasts_per_user(question: Question) -> dict[int, int]:
    """
    Return a mapping of user_id -> number-of-forecasts for question,
    restricted to forecasts that were live during the question’s active period
    """
    qs = (
        Forecast.objects.filter(question=question)
        .filter_within_question_period()
        .values("author_id")
        .annotate(ct=Count("id"))
    )

    return {row["author_id"]: row["ct"] for row in qs}


def get_outbound_question_links(question: Question, user: User) -> list[Question]:
    links = CoherenceLink.objects.filter(question1=question, user=user).select_related(
        "question2"
    )
    outbound_questions = [link.question2 for link in links]
    return outbound_questions


@cache_per_object(average_coverage_cache_key, timeout=60 * 60 * 24)
def get_average_coverage_for_questions(
    questions: Iterable[Question],
) -> dict[Question, float]:
    """
    Calculate the average coverage for each question based on scores
    from non-bot users with the question's default score type.
    """

    questions_list = list(q for q in questions if q.status != QuestionStatus.RESOLVED)

    # TODO: should we do archive scores?
    scores_data = (
        Score.objects.filter(
            question_id__in=[q.id for q in questions_list],
            score_type=F("question__default_score_type"),
            user__isnull=False,
        )
        .filter(Q(user__is_bot=False) | Q(question__include_bots_in_aggregates=True))
        .values_list("question_id", "coverage")
    )

    # Group scores by question_id for efficient filtering
    coverage_map: dict[int, list[float]] = defaultdict(list)
    for q_id, coverage in scores_data:
        coverage_map[q_id].append(coverage)

    # Calculate averages
    avg_coverage_map: dict[Question, float] = {}

    for question in questions_list:
        coverages = coverage_map.get(question.id, [])

        if len(coverages) > 0:
            avg_coverage_map[question] = sum(coverages) / len(coverages)

    return avg_coverage_map
