import logging
from datetime import datetime

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from notifications.services import delete_scheduled_question_resolution_notifications
from posts.models import Post
from posts.services.subscriptions import notify_post_status_change
from projects.services.cache import invalidate_projects_questions_count_cache
from projects.services.subscriptions import notify_project_subscriptions_post_open
from questions.constants import UnsuccessfulResolutionType
from questions.models import Question, Conditional, UserForecastNotification
from scoring.constants import ScoreTypes
from scoring.utils import score_question
from .common import update_leaderboards_for_question
from .forecasts import build_question_forecasts

logger = logging.getLogger(__name__)


def handle_question_open(question: Question):
    """
    A specific handler is triggered once it's opened
    """

    post = question.get_post()

    # Handle post subscriptions
    notify_post_status_change(post, Post.PostStatusChange.OPEN, question=question)

    # Handle question on followed projects subscriptions
    notify_project_subscriptions_post_open(post, question=question)


@transaction.atomic()
def handle_cp_revealed(question: Question):
    """
    A specific handler is triggered once the community prediction is revealed
    """

    post = question.get_post()

    # Handle post subscriptions
    notify_post_status_change(post, Post.PostStatusChange.CP_REVEALED, question=question)


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


@transaction.atomic()
def resolve_question(
    question: Question,
    resolution: str,
    actual_resolve_time: datetime,
):
    if question.open_time and question.open_time > actual_resolve_time:
        raise ValidationError("Can't resolve a question before its open date")

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
