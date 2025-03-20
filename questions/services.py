import logging
from collections import defaultdict
from collections.abc import Iterable
from datetime import datetime
from typing import cast

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from notifications.constants import MailingTags
from posts.models import PostUserSnapshot, PostSubscription, Notebook
from posts.services.subscriptions import create_subscription_cp_change
from posts.tasks import run_on_post_forecast
from projects.models import Project
from questions.constants import ResolutionType
from questions.models import (
    Question,
    GroupOfQuestions,
    Conditional,
    Forecast,
    AggregateForecast,
)
from questions.types import AggregationMethod
from scoring.models import Score, Leaderboard
from scoring.utils import score_question, update_project_leaderboard
from users.models import User
from utils.models import model_update
from utils.the_math.aggregations import get_aggregation_history
from utils.the_math.formulas import unscaled_location_to_scaled_location
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
):
    """
    Builds the AggregateForecasts for a question
    Stores them in the database
    """
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
                ResolutionType.ANNULLED,
                ResolutionType.AMBIGUOUS,
            ]:
                resolve_question(
                    conditional.question_no,
                    ResolutionType.ANNULLED,
                    actual_resolve_time,
                )
                resolve_question(
                    conditional.question_yes,
                    ResolutionType.ANNULLED,
                    actual_resolve_time,
                )
            if child.resolution is None:
                if question.resolution == "yes":
                    resolve_question(
                        conditional.question_no,
                        ResolutionType.ANNULLED,
                        actual_resolve_time,
                    )
                    close_question(
                        conditional.question_yes,
                        actual_close_time=question.actual_close_time,
                    )
                if question.resolution == "no":
                    resolve_question(
                        conditional.question_yes,
                        ResolutionType.ANNULLED,
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
                ResolutionType.ANNULLED,
                ResolutionType.AMBIGUOUS,
            ]:
                if question.resolution == "yes":
                    resolve_question(
                        conditional.question_yes,
                        child.resolution,
                        conditional.question_yes.actual_close_time,
                    )
                    resolve_question(
                        conditional.question_no,
                        ResolutionType.ANNULLED,
                        conditional.question_no.actual_close_time,
                    )
                if question.resolution == "no":
                    resolve_question(
                        conditional.question_no,
                        child.resolution,
                        conditional.question_no.actual_close_time,
                    )
                    resolve_question(
                        conditional.question_yes,
                        ResolutionType.ANNULLED,
                        conditional.question_yes.actual_close_time,
                    )
        else:  # question == child
            # handle annulment / ambiguity
            if question.resolution in [
                ResolutionType.ANNULLED,
                ResolutionType.AMBIGUOUS,
            ]:
                resolve_question(
                    conditional.question_yes,
                    ResolutionType.ANNULLED,
                    actual_resolve_time,
                )
                resolve_question(
                    conditional.question_no,
                    ResolutionType.ANNULLED,
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
                            conditional.question_yes.actual_close_time,
                        )
                    if condition.resolution == "no":
                        resolve_question(
                            conditional.question_no,
                            question.resolution,
                            conditional.question_no.actual_close_time,
                        )

    post = question.get_post()
    post.update_pseudo_materialized_fields()
    from posts.services.common import update_global_leaderboard_tags

    update_global_leaderboard_tags(post)
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
                ResolutionType.ANNULLED,
                ResolutionType.AMBIGUOUS,
            ]:
                # unresolve both branches (handles annulment / ambiguity automatically)
                unresolve_question(conditional.question_yes)
                unresolve_question(conditional.question_no)
            if child.resolution not in [
                None,
                ResolutionType.ANNULLED,
                ResolutionType.AMBIGUOUS,
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
        Score.ScoreTypes.BASELINE,
        Score.ScoreTypes.PEER,
        Score.ScoreTypes.RELATIVE_LEGACY,
    ]
    spot_forecast_time = question.cp_reveal_time
    if spot_forecast_time:
        score_types.append(Score.ScoreTypes.SPOT_PEER)
        score_types.append(Score.ScoreTypes.SPOT_BASELINE)
    score_question(
        question,
        None,  # None is the equivalent of unsetting scores
        spot_forecast_time=(
            spot_forecast_time.timestamp() if spot_forecast_time else None
        ),
        score_types=score_types,
    )

    # Update leaderboards
    update_leaderboards_for_question(question)


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
                    Leaderboard.ScoreTypes.COMMENT_INSIGHT,
                    Leaderboard.ScoreTypes.QUESTION_WRITING,
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
        end_time=None,
        continuous_cdf=continuous_cdf,
        probability_yes=probability_yes,
        probability_yes_per_category=probability_yes_per_category,
        distribution_input=(
            distribution_input if question.type in ["date", "numeric"] else None
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

    # There may be situations where async jobs from `create_forecast` complete after
    # `run_on_post_forecast` is triggered. To maintain the correct sequence of execution,
    # we need to ensure that `run_on_post_forecast` runs only after all forecasts have been processed.
    #
    # As a temporary solution, we introduce a 10-second delay before execution
    # to ensure all forecasts are processed.
    run_on_post_forecast.send_with_options(args=(post.id,), delay=10_000)


def create_forecast_bulk(*, user: User = None, forecasts: list[dict] = None):
    posts = set()

    for forecast in forecasts:
        question = forecast.pop("question")
        post = question.get_post()
        posts.add(post)

        create_forecast(question=question, user=user, **forecast)
        after_forecast_actions(question, user)


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
        forecasts_to_delete.delete()

        after_forecast_actions(question, user)

        # remove global subscriptions
        PostSubscription.objects.filter(
            user=user,
            post=post,
            type=PostSubscription.SubscriptionType.CP_CHANGE,
            is_global=True,
        ).delete()


def get_recency_weighted_for_questions(
    questions: Iterable[Question],
) -> dict[Question, AggregateForecast]:
    qs = (
        AggregateForecast.objects.filter(
            question__in=questions, method=AggregationMethod.RECENCY_WEIGHTED
        )
        .order_by("question_id", "-start_time")
        .distinct("question_id")
    )
    aggregations_map = {x.question_id: x for x in qs}

    return {q: aggregations_map.get(q.pk) for q in questions}


def get_aggregated_forecasts_for_questions(
    questions: Iterable[Question], group_cutoff: int = None
):
    """
    Extracts aggregated forecasts for the given questions.

    @param questions: questions to generate forecasts for
    @param group_cutoff: generated forecasts for the top first N questions of the group
    """

    # Copy questions list
    questions = list(questions)
    questions_to_fetch = set(questions)
    question_map = {q.pk: q for q in questions}
    aggregated_forecasts = set()

    if group_cutoff is not None:
        recently_weighted = get_recency_weighted_for_questions(questions)
        aggregated_forecasts.update([x for x in recently_weighted.values() if x])

        grouped = defaultdict(list)
        for q in questions:
            if (
                q.group_id
                and q.group.graph_type
                != GroupOfQuestions.GroupOfQuestionsGraphType.FAN_GRAPH
            ):
                grouped[q.group_id].append(q)

        def sorting_key(q: Question):
            """
            Extracts question aggregation forecast value
            """

            agg = recently_weighted.get(q)
            if not agg or len(agg.forecast_values) < 2:
                return 0
            if q.type == "binary":
                return agg.forecast_values[1]
            if q.type in ("numeric", "date"):
                return unscaled_location_to_scaled_location(agg.centers[0], q)
            if q.type == "multiple_choice":
                return max(agg.forecast_values)
            return 0

        cutoff_excluded = {
            q
            for qs in grouped.values()
            for q in sorted(qs, key=sorting_key, reverse=True)[group_cutoff:]
        }
        questions_to_fetch = questions_to_fetch - cutoff_excluded

    aggregated_forecasts.update(
        AggregateForecast.objects.filter(question__in=questions_to_fetch).exclude(
            # Exclude previously fetched aggregated_forecasts
            id__in=[f.id for f in aggregated_forecasts]
        )
    )

    forecasts_by_question = defaultdict(list)
    for forecast in sorted(aggregated_forecasts, key=lambda f: f.start_time):
        forecasts_by_question[question_map[forecast.question_id]].append(forecast)

    return forecasts_by_question
