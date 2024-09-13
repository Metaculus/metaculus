import dramatiq
from django.db.models import Q, OuterRef, Count
from sql_util.aggregates import SubqueryAggregate

from notifications.constants import MailingTags
from notifications.services import (
    NotificationPredictedQuestionResolved,
    NotificationPostParams,
    NotificationQuestionParams,
)
from questions.models import Question
from questions.services import build_question_forecasts
from scoring.models import Score
from scoring.utils import score_question
from users.models import User


@dramatiq.actor
def run_build_question_forecasts(question_id: int):
    """
    TODO: ensure tasks of this group are executed consequent and keep the FIFO order
        and implement a cancellation of previous task with the same type
    """

    question = Question.objects.get(id=question_id)
    build_question_forecasts(question)


@dramatiq.actor
def resolve_question_and_send_notifications(question_id: int):
    question: Question = Question.objects.get(id=question_id)
    post = question.get_post()

    # Generates Scores
    score_question(
        question,
        question.resolution,
        score_types=[
            Score.ScoreTypes.PEER,
            Score.ScoreTypes.BASELINE,
            Score.ScoreTypes.SPOT_PEER,
            Score.ScoreTypes.RELATIVE_LEGACY,
        ],
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
