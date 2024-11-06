import dramatiq
from django.db.models import Q, OuterRef, Count
from sql_util.aggregates import SubqueryAggregate

from notifications.constants import MailingTags
from notifications.services import (
    NotificationPredictedQuestionResolved,
    NotificationPostParams,
    NotificationQuestionParams,
)
from projects.models import Project
from questions.models import Question
from questions.services import build_question_forecasts
from scoring.models import Score, Leaderboard
from scoring.utils import score_question, update_project_leaderboard
from users.models import User
from utils.dramatiq import concurrency_retries, task_concurrent_limit


@dramatiq.actor(max_backoff=10_000, retry_when=concurrency_retries(max_retries=20))
@task_concurrent_limit(
    lambda question_id: f"build-question-forecasts-{question_id}",
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

    # scoring
    score_types = [
        Score.ScoreTypes.BASELINE,
        Score.ScoreTypes.PEER,
        Score.ScoreTypes.RELATIVE_LEGACY,
    ]
    spot_forecast_time = question.cp_reveal_time
    if spot_forecast_time:
        score_types.append(Score.ScoreTypes.SPOT_PEER)
    score_question(
        question,
        question.resolution,
        spot_forecast_time=(
            spot_forecast_time.timestamp() if spot_forecast_time else None
        ),
        score_types=score_types,
    )

    scores = (
        question.scores.filter(user__isnull=False)
        .annotate(
            forecasts_count=SubqueryAggregate(
                "question__user_forecasts",
                filter=Q(author=OuterRef("user")),
                aggregate=Count,
            )
        )
        # Exclude users with disabled notifications
        .exclude(
            user__unsubscribed_mailing_tags__contains=[
                MailingTags.FORECASTED_QUESTION_RESOLUTION
            ]
        )
        .select_related("user")
    )
    user_notification_params: dict[
        User, NotificationPredictedQuestionResolved.ParamsType
    ] = {}

    # Update leaderboards
    post = question.get_post()
    projects = [post.default_project] + list(post.projects.all())
    for project in projects:
        if project.type == Project.ProjectTypes.SITE_MAIN:
            continue

        leaderboards = project.leaderboards.all()
        for leaderboard in leaderboards:
            update_project_leaderboard(project, leaderboard)

    main_site_project = post.projects.filter(
        type=Project.ProjectTypes.SITE_MAIN
    ).first()
    if main_site_project:
        global_leaderboard_window = question.get_global_leaderboard_dates()
        if global_leaderboard_window is not None:
            global_leaderboards = Leaderboard.objects.filter(
                start_time=global_leaderboard_window[0],
                end_time=global_leaderboard_window[1],
            )
            for leaderboard in global_leaderboards:
                update_project_leaderboard(main_site_project, leaderboard)

    # Send notifications
    for score in scores:
        if score.user not in user_notification_params:
            user_notification_params[score.user] = (
                NotificationPredictedQuestionResolved.ParamsType(
                    post=NotificationPostParams.from_post(post),
                    question=NotificationQuestionParams.from_question(question),
                    resolution=question.resolution,
                    forecasts_count=score.forecasts_count,
                    coverage=score.coverage,
                )
            )

        notification_params = user_notification_params[score.user]

        if score.score_type == Score.ScoreTypes.PEER:
            notification_params.peer_score = score.score
        if score.score_type == Score.ScoreTypes.BASELINE:
            notification_params.baseline_score = score.score

    # Sending notifications
    for user, params in user_notification_params.items():
        NotificationPredictedQuestionResolved.send(user, params)
