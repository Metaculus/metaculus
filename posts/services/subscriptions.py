from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from comments.services import get_post_comments_count
from notifications.services import (
    NotificationNewComments,
    NotificationPostParams,
    NotificationPostMilestone,
    NotificationPostStatusChange,
    NotificationPostSpecificTime,
)
from posts.models import Post, PostSubscription


def generate_next_trigger_value_for_new_comments(post: Post, frequency: int) -> int:
    """
    Generates next trigger value for the new comments
    """

    return get_post_comments_count(post) + frequency


def notify_new_comments(post: Post):
    """
    Subscription handler to notify about new comments of the post

    Trigger: comment creation

    # TODO: Connect to the trigger function (create_comment) and make async!
    """

    comments_count = get_post_comments_count(post)

    subscriptions = post.subscriptions.filter(
        type=PostSubscription.SubscriptionType.NEW_COMMENTS,
        next_trigger_value__lte=comments_count,
    ).select_related("user")
    # TODO: replace with real subscription config!
    frequency = 1

    for subscription in subscriptions:
        user = subscription.user

        NotificationNewComments.send(
            user,
            NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(post),
                new_comments=frequency,
            ),
        )

        subscription.next_trigger_value = comments_count + frequency
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

    return ((get_post_lifespan_pct(post) // step) + 1) * step


def notify_milestone(post: Post):
    """
    Notify about new milestones of the post

    Please note: this function is not idempotent and should be triggered once per day only!

    # TODO: add a cron job for this
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

        # TODO: replace with real subscription config!
        step = 0.2

        subscription.update_last_sent_at()
        next_trigger_value = get_next_post_milestone(post, step)
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
            type=PostSubscription.SubscriptionType.MILESTONE,
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

        # TODO: add recurrence_interval field
        recurrence_interval = timedelta(days=7)

        if recurrence_interval:
            # This protects us from cases when we missed notifications job run for 2+ iterations
            # So this job won't send any duplicate reminders
            while subscription.next_trigger_datetime <= timezone.now():
                subscription.next_trigger_datetime += recurrence_interval

        subscription.update_last_sent_at()
        subscription.save()
