from collections.abc import Iterable
from datetime import datetime, timedelta

from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import Q, F, OuterRef, Case, When, Value, IntegerField
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from sql_util.aggregates import SubqueryAggregate

from notifications.constants import MailingTags
from notifications.services import (
    NotificationNewComments,
    NotificationPostParams,
    NotificationPostMilestone,
    NotificationPostStatusChange,
    NotificationPostSpecificTime,
    NotificationPostCPChange,
    CPChangeData,
    NotificationQuestionParams,
)
from posts.models import Post, PostSubscription
from questions.models import Question, Forecast, AggregateForecast
from questions.types import Direction
from questions.utils import get_last_forecast_in_the_past
from users.models import User
from utils.models import ArrayLength
from utils.the_math.formulas import (
    unscaled_location_to_scaled_location,
    get_scaled_quartiles_from_cdf,
)
from utils.the_math.measures import (
    prediction_difference_for_sorting,
    get_difference_display,
)


def _get_question_data_for_cp_change_notification(
    question: Question,
    current_entry: AggregateForecast,
    difference_display: list[tuple[Direction, float]],
    user_forecast: Forecast | None,
) -> list[CPChangeData]:
    question_data: list[CPChangeData] = []
    if question.type == "binary":
        data = CPChangeData(question=NotificationQuestionParams.from_question(question))
        data.cp_median = current_entry.centers[1] if current_entry.centers else None
        direction, magnitude = difference_display[0]
        data.cp_change_label = direction
        data.cp_change_value = magnitude

        if user_forecast:
            data.user_forecast = user_forecast.probability_yes
            data.forecast_date = user_forecast.start_time.isoformat()

        question_data.append(data)
    elif question.type == "multiple_choice":
        for i, label in enumerate(question.options):
            data = CPChangeData(
                question=NotificationQuestionParams.from_question(question)
            )
            data.label = label
            data.cp_median = (
                current_entry.centers[i] if current_entry.centers is not None else None
            )
            direction, magnitude = difference_display[i]
            data.cp_change_label = direction
            data.cp_change_value = magnitude
            data.user_forecast = (
                user_forecast.probability_yes_per_category[i] if user_forecast else None
            )
            question_data.append(data)
    else:  # continuous
        data = CPChangeData(question=NotificationQuestionParams.from_question(question))
        median = current_entry.centers[0] if current_entry.centers else None
        q1 = (
            current_entry.interval_lower_bounds[0]
            if current_entry.interval_lower_bounds
            else None
        )
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
        q3 = (
            current_entry.interval_upper_bounds[0]
            if current_entry.interval_upper_bounds
            else None
        )
        data.cp_q3 = (
            unscaled_location_to_scaled_location(q3, question)
            if q3 is not None
            else None
        )
        direction, magnitude = difference_display[0]
        data.cp_change_label = direction
        data.cp_change_value = magnitude
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


def get_last_user_forecasts_for_questions(
    question_ids: Iterable[int],
) -> dict[int, dict[int, Forecast]]:
    """
    Generates last user forecasts for given question ids
    """

    qs = (
        Forecast.objects.filter(question_id__in=question_ids)
        .order_by("question_id", "author_id", "-start_time")
        .distinct("question_id", "author_id")
    )

    forecasts_map = {}

    for forecast in qs:
        forecasts_map[forecast.question_id] = (
            forecasts_map.get(forecast.question_id) or {}
        )
        forecasts_map[forecast.question_id][forecast.author_id] = forecast

    return forecasts_map


def notify_post_cp_change(post: Post):
    """
    TODO: write description and check over
    """

    subscriptions = post.subscriptions.filter(
        type=PostSubscription.SubscriptionType.CP_CHANGE
    ).select_related("user")
    questions = Question.objects.filter(Q(post=post) | Q(group__post=post)).filter(
        # Don't send notifications before the CP is revealed
        Q(cp_reveal_time__lte=timezone.now())
    )

    if not questions:
        return

    forecast_history = {
        question: list(
            AggregateForecast.objects.filter(
                question=question,
                method=question.default_aggregation_method,
                start_time__gte=question.cp_reveal_time or question.created_at,
            ).order_by("start_time")
        )
        for question in questions
    }
    question_author_forecasts_map = get_last_user_forecasts_for_questions(
        [q.pk for q in questions]
    )

    for subscription in subscriptions:
        last_sent = subscription.last_sent_at
        max_sorting_diff = None
        question_data: list[CPChangeData] = []
        for question, forecast_summary in forecast_history.items():
            user_pred = question_author_forecasts_map.get(question.pk, {}).get(
                subscription.user_id
            )
            if user_pred:
                comparison_time = max(last_sent, user_pred.start_time)
            else:
                comparison_time = last_sent
            entry: AggregateForecast | None = None
            for forecast in forecast_summary:
                if forecast.start_time <= comparison_time and (
                    forecast.end_time is None or forecast.end_time > comparison_time
                ):
                    entry = forecast
                    break
            if entry is None:
                continue
            old_forecast_values = entry.forecast_values
            current_entry = get_last_forecast_in_the_past(forecast_summary)

            if not current_entry:
                continue

            current_forecast_values = current_entry.forecast_values
            difference = prediction_difference_for_sorting(
                old_forecast_values,
                current_forecast_values,
                question_type=question.type,
            )
            if max_sorting_diff is None or difference > max_sorting_diff:
                max_sorting_diff = difference
            difference_display = get_difference_display(
                entry,
                current_entry,
                question,
            )

            question_data += _get_question_data_for_cp_change_notification(
                question,
                current_entry,
                difference_display,
                user_pred,
            )

        if max_sorting_diff and max_sorting_diff >= subscription.cp_change_threshold:
            NotificationPostCPChange.schedule(
                subscription.user,
                NotificationPostCPChange.ParamsType(
                    post=NotificationPostParams.from_post(post),
                    question_data=question_data,
                    last_sent=last_sent.isoformat() if last_sent else None,
                ),
                # Send notifications to the users that subscribed to the post CP changes
                # Or we automatically subscribed them for "Forecasted Questions CP change"
                mailing_tag=(
                    None
                    if not subscription.is_global
                    else MailingTags.FORECASTED_CP_CHANGE
                ),
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

        NotificationNewComments.schedule(
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

    if not post.open_time or not post.scheduled_resolve_time:
        return

    duration = post.scheduled_close_time - post.open_time
    passed = timezone.now() - post.open_time

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
        NotificationPostMilestone.schedule(
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


def notify_post_status_change(
    post: Post, event: Post.PostStatusChange, question: Question = None
):
    """
    Notify about post status change
    """

    subscriptions = post.subscriptions.filter(
        type=PostSubscription.SubscriptionType.STATUS_CHANGE
    ).select_related("user")

    for subscription in subscriptions:
        NotificationPostStatusChange.schedule(
            subscription.user,
            NotificationPostStatusChange.ParamsType(
                post=NotificationPostParams.from_post(post),
                event=event,
                question=NotificationQuestionParams.from_question(question),
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
            next_trigger_datetime__lte=timezone.now(),
        )
        .filter(
            # Exclude already sent notifications
            Q(last_sent_at__isnull=True)
            | Q(last_sent_at__lt=F("next_trigger_datetime"))
        )
        .filter(
            Q(post__actual_close_time__isnull=True)
            | Q(post__actual_close_time__gt=timezone.now())
        )
        .select_related("post")
    )

    for subscription in subscriptions:
        NotificationPostSpecificTime.schedule(
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
    is_global=False,
    save=True,
):
    obj = PostSubscription.objects.create(
        user=user,
        post=post,
        type=PostSubscription.SubscriptionType.CP_CHANGE,
        cp_change_threshold=cp_change_threshold,
        last_sent_at=timezone.now(),
        is_global=is_global,
    )

    if save:
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


def disable_global_cp_reminders(user: User):
    PostSubscription.objects.filter(
        user=user, type=PostSubscription.SubscriptionType.CP_CHANGE, is_global=True
    ).delete()


def enable_global_cp_reminders(user: User):
    forecasted_posts = (
        Post.objects.filter_permission(user=user)
        .filter_active()
        .filter(forecasts__author=user)
        .distinct("pk")
    )

    PostSubscription.objects.bulk_create(
        [
            create_subscription_cp_change(
                user=user,
                post=post,
                cp_change_threshold=0.1,
                is_global=True,
                save=False,
            )
            for post in forecasted_posts
        ],
        ignore_conflicts=True,
    )
