import logging
from datetime import datetime, timedelta

import dramatiq
from django.conf import settings
from django.db.models import Q
from django.utils import timezone

from comments.services.common import create_comment
from notifications.constants import MailingTags
from notifications.services import (
    NotificationPredictedQuestionResolved,
    NotificationPostParams,
    NotificationQuestionParams,
    send_forecast_autowidrawal_notification,
    delete_scheduled_question_resolution_notifications,
)
from posts.models import Post
from posts.services.subscriptions import notify_post_status_change
from questions.models import Forecast, Question, UserForecastNotification
from questions.services.common import get_outbound_question_links
from questions.services.forecasts import (
    build_question_forecasts,
    get_forecasts_per_user,
)
from scoring.constants import ScoreTypes
from scoring.utils import score_question
from users.models import User
from utils.dramatiq import concurrency_retries, task_concurrent_limit
from utils.email import send_email_with_template
from utils.frontend import build_frontend_account_settings_url, build_post_url


@dramatiq.actor(max_backoff=10_000, retry_when=concurrency_retries(max_retries=20))
@task_concurrent_limit(
    lambda question_id: f"mutex:build-question-forecasts-{question_id}",
    # We want only one task for the same question id be executed at the same time
    # To ensure all forecasts will be included in the AggregatedForecasts model
    limit=1,
    # This task shouldn't take longer than 1m
    # So it's fine to set mutex lock timeout for this duration
    ttl=60_000,
)
def run_build_question_forecasts(question_id: int):
    """
    The current concurrency limiter is not ideal because it does not execute consecutive tasks
    with the same question_id sequentially. Instead,
    it postpones their execution using exponential backoff,
    which means there's no guarantee of maintaining the original order.

    In the future I'd consider to move to Kafka
    https://kafka.apache.org/
    """

    question = Question.objects.get(id=question_id)
    build_question_forecasts(question)


@dramatiq.actor(time_limit=1_800_000)
def resolve_question_and_send_notifications(question_id: int):
    question: Question = Question.objects.get(id=question_id)

    # Delete already scheduled resolution notifications
    delete_scheduled_question_resolution_notifications(question)

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
        question.resolution,
        spot_scoring_time=spot_scoring_time,
        score_types=score_types,
    )

    scores = (
        question.scores.filter(user__isnull=False)
        # Exclude users with disabled notifications
        .exclude(
            user__unsubscribed_mailing_tags__contains=[
                MailingTags.FORECASTED_QUESTION_RESOLUTION
            ]
        ).select_related("user")
    )
    user_forecasts_count_map = get_forecasts_per_user(question)

    user_notification_params: dict[
        User, NotificationPredictedQuestionResolved.ParamsType
    ] = {}

    # Update leaderboards
    from questions.services.common import update_leaderboards_for_question

    update_leaderboards_for_question(question)

    # Rebuild question aggregations
    build_question_forecasts(question)

    # Send question resolution notifications
    notify_post_status_change(
        question.get_post(), Post.PostStatusChange.RESOLVED, question=question
    )

    # Send notifications
    for score in scores:
        if score.user not in user_notification_params:
            forecasts_count = user_forecasts_count_map.get(score.user_id) or 0
            linked_questions = get_outbound_question_links(question, score.user)

            user_notification_params[score.user] = (
                NotificationPredictedQuestionResolved.ParamsType(
                    post=NotificationPostParams.from_post(question.get_post()),
                    question=NotificationQuestionParams.from_question(question),
                    resolution=question.resolution,
                    forecasts_count=forecasts_count,
                    coverage=score.coverage,
                    linked_questions=[
                        NotificationQuestionParams.from_question(q)
                        for q in linked_questions
                    ],
                )
            )

        notification_params = user_notification_params[score.user]

        if score.score_type == ScoreTypes.PEER:
            notification_params.peer_score = score.score
        if score.score_type == ScoreTypes.BASELINE:
            notification_params.baseline_score = score.score

    # Sending notifications
    for user, params in user_notification_params.items():
        NotificationPredictedQuestionResolved.schedule(user, params)


@dramatiq.actor
def check_and_schedule_forecast_widrawal_due_notifications():
    now = timezone.now()
    one_day_from_now = now + timedelta(days=1)

    # Base query for notifications that are due and not sent.
    # Check only the last day to avoid sending notifications for old forecasts
    # when the user might have been unsubscribed.
    due_and_unsent = Q(
        trigger_time__gte=now,
        trigger_time__lt=one_day_from_now,
        email_sent=False,
    )

    # Condition for users who have unsubscribed from this type of notification
    user_is_unsubscribed = Q(
        user__unsubscribed_mailing_tags__contains=[
            MailingTags.BEFORE_PREDICTION_AUTO_WITHDRAWAL
        ]
    )

    # A question is considered closed if its scheduled close time has passed,
    # or if an actual close time has been set and has passed.
    question_is_closed = Q(question__scheduled_close_time__lte=now) | Q(
        question__actual_close_time__lte=now
    )

    forecast_alreday_withdrawn = Q(forecast__end_time__lt=now)

    all_notifications = UserForecastNotification.objects.filter(due_and_unsent).exclude(
        user_is_unsubscribed | question_is_closed | forecast_alreday_withdrawn
    )

    # Group notifications by user and post
    user_notifications = {}

    for notification in all_notifications:
        user = notification.user
        post = notification.question.get_post()

        if not post:
            logging.warning(
                f"No post found for forecast {notification.forecast.id} for user {user.id}"
            )
            continue

        if user.email not in user_notifications:
            user_notifications[user.email] = {
                "user": user,
                "posts": [],
                "notifications": [],
            }

        if post.id not in [p["id"] for p in user_notifications[user.email]["posts"]]:
            user_notifications[user.email]["posts"].append(
                {
                    "id": post.id,
                    "title": post.title,
                    "url": build_post_url(post),
                    "expiration_date": (
                        notification.forecast.end_time.strftime("%B %d, %Y at %H:%M %Z")
                        if notification.forecast.end_time
                        else None
                    ),
                }
            )

        user_notifications[user.email]["notifications"].append(notification)

    # Sort posts by expiration_date, ascending
    for notification_data in user_notifications.values():
        notification_data["posts"].sort(
            key=lambda post: (post["expiration_date"] is None, post["expiration_date"])
        )

    logging.info(f"Sending {len(user_notifications)} notifications")

    # Send batched notifications
    for _, notification_data in user_notifications.items():
        email_sent = send_forecast_autowidrawal_notification(
            user=notification_data["user"],
            posts_data=notification_data["posts"],
            account_settings_url=build_frontend_account_settings_url(),
        )

        if email_sent:
            for notification in notification_data["notifications"]:
                notification.email_sent = True
                notification.save()


def format_time_remaining(time_remaining: timedelta):
    total_seconds = int(time_remaining.total_seconds())

    if total_seconds < 0:
        return "0 minutes"

    days = time_remaining.days

    if days >= 365:
        years = days // 365
        return f"{years} year{'s' if years != 1 else ''}"
    elif days >= 30:
        months = days // 30
        return f"{months} month{'s' if months != 1 else ''}"
    elif days >= 7:
        weeks = days // 7
        return f"{weeks} week{'s' if weeks != 1 else ''}"
    elif days > 0:
        return f"{days} day{'s' if days != 1 else ''}"
    elif total_seconds >= 3600:
        hours = total_seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''}"
    elif total_seconds >= 60:
        minutes = total_seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    else:
        return f"{total_seconds} second{'s' if total_seconds != 1 else ''}"


@dramatiq.actor
def multiple_choice_delete_option_notificiations(
    question_id: int,
    timestep: datetime,
    comment_author_id: int,
):
    question = Question.objects.get(id=question_id)
    post = question.get_post()
    options_history = question.options_history
    removed_options = list(set(options_history[-2][1]) - set(options_history[-1][1]))

    # send out a comment
    comment_author = User.objects.get(id=comment_author_id)
    create_comment(
        comment_author,
        on_post=post,
        text=(
            f"PLACEHOLDER: (at)forecasters Option(s) {removed_options} "
            f"were removed at {timestep}."
        ),
    )

    forecasters = (
        User.objects.filter(
            forecast__in=question.user_forecasts.filter(
                Q(end_time__isnull=True) | Q(end_time__gt=timestep)
            )
        )
        .exclude(
            unsubscribed_mailing_tags__contains=[
                MailingTags.BEFORE_PREDICTION_AUTO_WITHDRAWAL  # seems most reasonable
            ]
        )
        .exclude(email__isnull=True)
        .exclude(email="")
        .distinct("id")
        .order_by("id")
    )
    # send out an immediate email
    for forecaster in forecasters:
        send_email_with_template(
            to=forecaster.email,
            subject="Multiple choice option removed",
            template_name="emails/multiple_choice_option_deletion.html",
            context={
                "recipient": forecaster,
                "email_subject_display": "Multiple choice option removed",
                "similar_posts": [],
                "params": {
                    "post": NotificationPostParams.from_post(post),
                    "removed_options": removed_options,
                    "timestep": timestep,
                },
            },
            use_async=False,
            from_email=settings.EMAIL_NOTIFICATIONS_USER,
        )


@dramatiq.actor
def multiple_choice_add_option_notificiations(
    question_id: int,
    grace_period_end: datetime,
    timestep: datetime,
    comment_author_id: int,
):
    question = Question.objects.get(id=question_id)
    post = question.get_post()
    options_history = question.options_history
    added_options = list(set(options_history[-1][1]) - set(options_history[-2][1]))

    # send out a comment
    comment_author = User.objects.get(id=comment_author_id)
    create_comment(
        comment_author,
        on_post=post,
        text=(
            f"PLACEHOLDER: (at)forecasters Option(s) {added_options} "
            f"were added at {timestep}. "
            f"You have until {grace_period_end} to update your forecast to reflect "
            "the new options. "
            "If you do not, your forecast will be automatically withdrawn "
            f"at {grace_period_end}. "
            "Please see our faq (link) for details on how this works."
        ),
    )

    forecasters = (
        User.objects.filter(
            forecast__in=question.user_forecasts.filter(
                end_time=grace_period_end
            )  # all effected forecasts have their end_time set to grace_period_end
        )
        .exclude(
            unsubscribed_mailing_tags__contains=[
                MailingTags.BEFORE_PREDICTION_AUTO_WITHDRAWAL  # seems most reasonable
            ]
        )
        .exclude(email__isnull=True)
        .exclude(email="")
        .distinct("id")
        .order_by("id")
    )
    # send out an immediate email
    for forecaster in forecasters:
        send_email_with_template(
            to=forecaster.email,
            subject="Multiple choice options added",
            template_name="emails/multiple_choice_option_addition.html",
            context={
                "recipient": forecaster,
                "email_subject_display": "Multiple choice options added",
                "similar_posts": [],
                "params": {
                    "post": NotificationPostParams.from_post(post),
                    "added_options": added_options,
                    "grace_period_end": grace_period_end,
                    "timestep": timestep,
                },
            },
            use_async=False,
            from_email=settings.EMAIL_NOTIFICATIONS_USER,
        )

    # schedule a followup email for 1 day before grace period
    #   (if grace period is more than 1 day away)
    if grace_period_end - timedelta(days=1) > timestep:
        for forecaster in forecasters:
            UserForecastNotification.objects.filter(
                user=forecaster, question=question
            ).delete()  # is this necessary?
            UserForecastNotification.objects.update_or_create(
                user=forecaster,
                question=question,
                defaults={
                    "trigger_time": grace_period_end - timedelta(days=1),
                    "email_sent": False,
                    "forecast": Forecast.objects.filter(
                        question=question, author=forecaster
                    )
                    .order_by("-start_time")
                    .first(),
                },
            )
