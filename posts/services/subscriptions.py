from datetime import datetime, timedelta

from django.db.models import Q, Count, F, OuterRef, Value
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
)
from posts.models import Post, PostSubscription
from users.models import User


def notify_post_cp_change(post: Post):
    """
    TODO: implement
    """


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
            new_comments_count=SubqueryAggregate(
                "post__comments__id",
                filter=Q(
                    (
                        Q(
                            created_at__gte=Coalesce(
                                OuterRef("last_sent_at"), Value("1970-01-01")
                            )
                        )
                    )
                    & ~Q(author=OuterRef("user"))
                    & Q(is_soft_deleted=False)
                    & Q(is_private=False)
                ),
                aggregate=Count,
            )
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
                new_comments=subscription.new_comments_count,
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

    TODO: connect to the post triggers
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
    cp_threshold: timedelta = None,
):
    obj = PostSubscription.objects.create(
        user=user,
        post=post,
        type=PostSubscription.SubscriptionType.CP_CHANGE,
        cp_threshold=cp_threshold,
        # TODO: add extra logic
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
