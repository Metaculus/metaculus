from datetime import datetime, timedelta

from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import Q, F, OuterRef, Case, When, Value, IntegerField
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from sql_util.aggregates import SubqueryAggregate

from notifications.services import (
    NotificationNewComments,
    NotificationPostParams,
    NotificationPostMilestone,
    NotificationPostStatusChange,
    NotificationPostSpecificTime,
    NotificationPostCPChange,
    CPChangeData,
)
from posts.models import Post, PostSubscription
from questions.models import Question, Forecast
from users.models import User
from utils.the_math.community_prediction import get_cp_history, AggregationEntry
from utils.the_math.formulas import (
    unscaled_location_to_scaled_location,
    get_scaled_quartiles_from_cdf,
)
from utils.the_math.measures import (
    prediction_difference_for_sorting,
    prediction_difference_for_display,
)
from utils.models import ArrayLength


def _get_question_data_for_cp_change_notification(
    question: Question,
    current_entry: AggregationEntry,
    display_diff: list[tuple[float, float]],
    user_forecast: Forecast | None,
) -> list[CPChangeData]:
    question_data: list[CPChangeData] = []
    if question.type == "binary":
        data = CPChangeData(question)
        data.cp_median = current_entry.medians[1] if current_entry.medians else None
        data.absolute_difference = display_diff[0][0]
        data.odds_ratio = display_diff[0][1]
        data.user_forecast = user_forecast.probability_yes if user_forecast else None
        question_data.append(data)
    elif question.type == "multiple_choice":
        for i, label in enumerate(question.options):
            data = CPChangeData(question, None)
            data.label = label
            data.cp_median = (
                current_entry.medians[i] if current_entry.medians is not None else None
            )
            data.absolute_difference = display_diff[i][0]
            data.odds_ratio = display_diff[i][1]
            data.user_forecast = (
                user_forecast.probability_yes_per_category[i] if user_forecast else None
            )
            question_data.append(data)
    else:  # continuous
        data = CPChangeData(question)
        median = current_entry.medians[0] if current_entry.medians else None
        q1 = current_entry.q1s[0] if current_entry.q1s else None
        data.cp_q1 = (
            unscaled_location_to_scaled_location(q1, question)
            if q1 is not None
            else None
        )
        data.cp_median = (
            unscaled_location_to_scaled_location(median, question)
            if median is not None
            else None
        )
        q3 = current_entry.q3s[0] if current_entry.q3s else None
        data.cp_q3 = (
            unscaled_location_to_scaled_location(q3, question)
            if q3 is not None
            else None
        )
        data.earth_movers_diff = display_diff[0]
        data.assymetry = display_diff[1]
        user_q1, user_median, user_q3 = None, None, None
        if user_forecast:
            user_q1, user_median, user_q3 = get_scaled_quartiles_from_cdf(
                user_forecast.continuous_cdf, question
            )
        data.user_q1 = user_q1
        data.user_median = user_median
        data.user_q3 = user_q3
        question_data.append(data)
    return question_data


def notify_post_cp_change(post: Post):
    """
    TODO: write description and check over
    """

    subscriptions = post.subscriptions.filter(
        type=PostSubscription.SubscriptionType.CP_CHANGE,
        next_trigger_value__lte=post.cp,
    ).select_related("user")
    questions = Question.objects.filter(Q(post=post) | Q(group__post=post))
    forecast_history = {
        question: AggregationEntry.from_composed_forecasts(question.composed_forecasts)
        for question in questions
    }

    for subscription in subscriptions:
        last_sent = subscription.last_sent_at
        max_sorting_diff = None
        display_diff = None
        question_data: list[CPChangeData] = []
        for question, forecast_summary in forecast_history.items():
            entry: AggregationEntry | None = None
            for entry in forecast_summary:
                if entry.start_time <= last_sent and (
                    entry.end_time is None or entry.end_time > last_sent
                ):
                    break
            if entry is None:
                continue
            old_forecast_values = entry.forecast_values
            current_entry = forecast_summary[-1]
            current_forecast_values = current_entry.forecast_values
            difference = prediction_difference_for_sorting(
                old_forecast_values,
                current_forecast_values,
                question=question,
            )
            if max_sorting_diff is None or difference > max_sorting_diff:
                max_sorting_diff = difference
                display_diff = prediction_difference_for_display(
                    old_forecast_values,
                    current_forecast_values,
                    question=question,
                )
            user_pred: Forecast = (
                question.forecasts.filter(
                    user=subscription.user,
                )
                .order_by("-start_time")
                .first()
            )
            question_data += _get_question_data_for_cp_change_notification(
                question,
                current_entry,
                display_diff,
                user_pred,
            )
        if not max_sorting_diff or not (
            max_sorting_diff < subscription.cp_change_threshold
        ):
            continue

        # we have to send a notification
        NotificationPostCPChange.send(
            subscription.user,
            NotificationPostCPChange.ParamsType(post, question_data),
        )

        subscription.update_last_sent_at()
        subscription.save()


def notify_new_comments(post: Post):
    """
    Subscription handler to notify about new comments of the post

    Trigger: comment creation
    """

    subscriptions = (
        post.subscriptions.filter(
            type=PostSubscription.SubscriptionType.NEW_COMMENTS,
        )
        .annotate(
            new_comment_ids=SubqueryAggregate(
                "post__comments__id",
                filter=Q(
                    (
                        Q(
                            created_at__gte=Coalesce(
                                OuterRef("last_sent_at"), OuterRef("created_at")
                            )
                        )
                    )
                    & ~Q(author=OuterRef("user"))
                    & Q(is_soft_deleted=False)
                    & Q(is_private=False)
                ),
                aggregate=ArrayAgg,
            ),
            new_comments_count=Case(
                When(new_comment_ids__isnull=True, then=Value(0)),
                default=ArrayLength("new_comment_ids"),
                output_field=IntegerField(),
            ),
        )
        .filter(new_comments_count__gte=F("comments_frequency"))
        .select_related("user")
    )

    for subscription in subscriptions:
        user = subscription.user

        NotificationNewComments.send(
            user,
            NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(post),
                new_comments_count=subscription.new_comments_count,
                new_comment_ids=subscription.new_comment_ids,
            ),
        )

        subscription.update_last_sent_at()
        subscription.save()


def get_post_lifespan_pct(post: Post) -> float | None:
    """
    Returns current post milestone
    """

    if not post.published_at or not post.scheduled_resolve_time:
        return

    duration = post.scheduled_close_time - post.published_at
    passed = timezone.now() - post.published_at

    return passed / duration


def get_next_post_milestone(post: Post, step: float):
    """
    Generate next percentage milestone for a post notification
    """

    # TODO: check float conversions e.g 0.2 * 3.0 == 0.60000001
    return ((get_post_lifespan_pct(post) // step) + 1) * step


def notify_milestone(post: Post):
    """
    Notify about new milestones of the post

    Please note: this function is not idempotent and should be triggered once per day only!
    """

    lifespan_pct = get_post_lifespan_pct(post)

    if not lifespan_pct:
        return

    subscriptions = post.subscriptions.filter(
        type=PostSubscription.SubscriptionType.MILESTONE,
        next_trigger_value__lte=get_post_lifespan_pct(post),
    ).select_related("user")

    for subscription in subscriptions:
        NotificationPostMilestone.send(
            subscription.user,
            NotificationPostMilestone.ParamsType(
                post=NotificationPostParams.from_post(post),
                lifespan_pct=subscription.next_trigger_value,
            ),
        )

        subscription.update_last_sent_at()
        next_trigger_value = get_next_post_milestone(post, subscription.milestone_step)
        subscription.next_trigger_value = (
            next_trigger_value if next_trigger_value <= 100 else None
        )
        subscription.save()


def notify_post_status_change(post: Post, event: PostSubscription.PostStatusChange):
    """
    Notify about post status change
    """

    subscriptions = post.subscriptions.filter(
        type=PostSubscription.SubscriptionType.STATUS_CHANGE
    ).select_related("user")

    for subscription in subscriptions:
        NotificationPostStatusChange.send(
            subscription.user,
            NotificationPostStatusChange.ParamsType(
                post=NotificationPostParams.from_post(post), event=event
            ),
        )

        subscription.update_last_sent_at()
        subscription.save()


def notify_date():
    """
    Custom on date notification
    """

    subscriptions = (
        PostSubscription.objects.filter(
            type=PostSubscription.SubscriptionType.SPECIFIC_TIME,
            next_trigger_datetime_lte=timezone.now(),
        )
        .filter(
            Q(post__actual_close_time__isnull=True)
            | Q(post__actual_close_time__gt=timezone.now())
        )
        .select_related("post")
    )

    for subscription in subscriptions:
        NotificationPostSpecificTime.send(
            subscription.user,
            NotificationPostSpecificTime.ParamsType(
                post=NotificationPostParams.from_post(subscription.post)
            ),
        )

        if subscription.recurrence_interval:
            # This protects us from cases when we missed notifications job run for 2+ iterations
            # So this job won't send any duplicate reminders
            while subscription.next_trigger_datetime <= timezone.now():
                subscription.next_trigger_datetime += subscription.recurrence_interval

        subscription.update_last_sent_at()
        subscription.save()


#
# Subscription factories
#


def create_subscription_new_comments(
    user: User = None, post: Post = None, comments_frequency: int = None
) -> PostSubscription:
    obj = PostSubscription.objects.create(
        user=user,
        post=post,
        type=PostSubscription.SubscriptionType.NEW_COMMENTS,
        comments_frequency=comments_frequency,
    )

    obj.full_clean()
    obj.save()

    return obj


def create_subscription_cp_change(
    user: User,
    post: Post,
    cp_change_threshold: float = 0.25,
):
    obj = PostSubscription.objects.create(
        user=user,
        post=post,
        type=PostSubscription.SubscriptionType.CP_CHANGE,
        cp_change_threshold=cp_change_threshold,
        last_sent_at=timezone.now(),
        # TODO: adjust `migrator.services.migrate_subscriptions.migrate_cp_change` in the old db migrator script!
    )

    obj.full_clean()
    obj.save()

    return obj


def create_subscription_milestone(
    user: User = None, post: Post = None, milestone_step: float = None
) -> PostSubscription:
    obj = PostSubscription.objects.create(
        user=user,
        post=post,
        type=PostSubscription.SubscriptionType.MILESTONE,
        milestone_step=milestone_step,
        next_trigger_value=get_next_post_milestone(post, milestone_step),
    )

    obj.full_clean()
    obj.save()

    return obj


def create_subscription_status_change(user: User, post: Post):
    obj = PostSubscription.objects.create(
        user=user, post=post, type=PostSubscription.SubscriptionType.STATUS_CHANGE
    )

    obj.full_clean()
    obj.save()

    return obj


def create_subscription_specific_time(
    user: User,
    post: Post,
    next_trigger_datetime: datetime = None,
    recurrence_interval: timedelta = None,
):
    obj = PostSubscription.objects.create(
        user=user,
        post=post,
        type=PostSubscription.SubscriptionType.SPECIFIC_TIME,
        recurrence_interval=recurrence_interval,
        next_trigger_datetime=next_trigger_datetime,
    )

    obj.full_clean()
    obj.save()

    return obj


def create_subscription(
    subscription_type: PostSubscription.SubscriptionType,
    user: User,
    post: Post,
    **kwargs,
):
    factories_map = {
        PostSubscription.SubscriptionType.NEW_COMMENTS: create_subscription_new_comments,
        PostSubscription.SubscriptionType.STATUS_CHANGE: create_subscription_status_change,
        PostSubscription.SubscriptionType.MILESTONE: create_subscription_milestone,
        PostSubscription.SubscriptionType.SPECIFIC_TIME: create_subscription_specific_time,
        PostSubscription.SubscriptionType.CP_CHANGE: create_subscription_cp_change,
    }

    if f := factories_map.get(subscription_type):
        return f(user=user, post=post, **kwargs)

    raise ValidationError("Wrong subscription type")
