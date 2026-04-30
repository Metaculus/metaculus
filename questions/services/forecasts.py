import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone as dt_timezone
from typing import cast, Iterable, Literal

import sentry_sdk
from django.db import transaction
from django.db.models import F, Q, QuerySet, Subquery, OuterRef, Count
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from notifications.constants import MailingTags
from posts.models import PostUserSnapshot, PostSubscription
from posts.services.subscriptions import (
    create_subscription_cp_change,
    create_subscription,
)
from posts.tasks import run_on_post_forecast
from questions.services.multiple_choice_handlers import get_all_options_from_history
from scoring.models import Score
from users.models import User
from utils.cache import cache_per_object
from utils.the_math.aggregations import get_aggregation_history
from .common import get_questions_cutoff
from ..cache import average_coverage_cache_key
from ..constants import QuestionStatus
from ..models import (
    QUESTION_CONTINUOUS_TYPES,
    Question,
    Forecast,
    AggregateForecast,
    UserForecastNotification,
)
from ..types import AggregationMethod

logger = logging.getLogger(__name__)


def create_forecast(
    *,
    question: Question,
    user: User,
    continuous_cdf: list[float] | None = None,
    probability_yes: float | None = None,
    probability_yes_per_category: list[float | None] | None = None,
    distribution_input: dict | None = None,
    end_time: datetime | None = None,
    source: Forecast.SourceChoices | Literal[""] | None = None,
    **kwargs,
):
    now = timezone.now()
    post = question.get_post()
    source = source or ""

    # delete all future-dated predictions, as this one will override them
    Forecast.objects.filter(question=question, author=user, start_time__gt=now).delete()

    # if the forecast to be created is for a multiple choice question during a grace
    # period, we need to agument the forecast accordingly (possibly preregister)
    if question.type == Question.QuestionType.MULTIPLE_CHOICE:
        if not probability_yes_per_category:
            raise ValueError("probability_yes_per_category required for MC questions")
        options_history = question.options_history
        if options_history and len(options_history) > 1:
            period_end = datetime.fromisoformat(options_history[-1][0]).replace(
                tzinfo=dt_timezone.utc
            )
            if period_end > now:
                all_options = get_all_options_from_history(question.options_history)
                prior_options = options_history[-2][1]
                if end_time is None or end_time > period_end:
                    # create a pre-registration for the given forecast
                    Forecast.objects.create(
                        question=question,
                        author=user,
                        start_time=period_end,
                        end_time=end_time,
                        probability_yes_per_category=probability_yes_per_category,
                        post=post,
                        source=Forecast.SourceChoices.AUTOMATIC,
                        **kwargs,
                    )
                    end_time = period_end

                prior_pmf: list[float | None] = [None] * len(all_options)
                for i, (option, value) in enumerate(
                    zip(all_options, probability_yes_per_category)
                ):
                    if value is None:
                        continue
                    if option in prior_options:
                        prior_pmf[i] = (prior_pmf[i] or 0.0) + value
                    else:
                        prior_pmf[-1] = (prior_pmf[-1] or 0.0) + value
                probability_yes_per_category = prior_pmf

    forecast = Forecast.objects.create(
        question=question,
        author=user,
        start_time=now,
        end_time=end_time,
        continuous_cdf=continuous_cdf,
        probability_yes=probability_yes,
        probability_yes_per_category=probability_yes_per_category,
        distribution_input=(
            distribution_input if question.type in QUESTION_CONTINUOUS_TYPES else None
        ),
        post=post,
        source=source,
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
    from ..tasks import run_build_question_forecasts

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

    if created and user.automatically_follow_on_predict:
        post = question.post
        existing_subscription = post.subscriptions.filter(user=user).exclude(
            is_global=True
        )
        if (
            user.follow_notify_cp_change_threshold
            and not existing_subscription.filter(
                type=PostSubscription.SubscriptionType.CP_CHANGE
            ).exists()
        ):
            create_subscription(
                subscription_type=PostSubscription.SubscriptionType.CP_CHANGE,
                user=user,
                post=post,
                cp_change_threshold=user.follow_notify_cp_change_threshold,
            )
        if (
            user.follow_notify_comments_frequency
            and not existing_subscription.filter(
                type=PostSubscription.SubscriptionType.NEW_COMMENTS
            ).exists()
        ):
            create_subscription(
                subscription_type=PostSubscription.SubscriptionType.NEW_COMMENTS,
                user=user,
                post=post,
                comments_frequency=user.follow_notify_comments_frequency,
            )
        if (
            user.follow_notify_milestone_step
            and not existing_subscription.filter(
                type=PostSubscription.SubscriptionType.MILESTONE
            ).exists()
        ):
            create_subscription(
                subscription_type=PostSubscription.SubscriptionType.MILESTONE,
                user=user,
                post=post,
                milestone_step=user.follow_notify_milestone_step,
            )
        if (
            user.follow_notify_on_status_change
            and not existing_subscription.filter(
                type=PostSubscription.SubscriptionType.STATUS_CHANGE
            ).exists()
        ):
            create_subscription(
                subscription_type=PostSubscription.SubscriptionType.STATUS_CHANGE,
                user=user,
                post=post,
            )


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


@cache_per_object(average_coverage_cache_key, timeout=60 * 60 * 24)
def get_average_coverage_for_questions(
    questions: Iterable[Question],
) -> dict[Question, float]:
    """
    Calculate the average coverage for each question based on scores
    from non-bot users with the question's default score type.
    """

    questions_list = list(q for q in questions if q.status == QuestionStatus.RESOLVED)

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


@sentry_sdk.trace
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
