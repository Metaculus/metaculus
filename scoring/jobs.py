import logging

from django.utils import timezone
from datetime import datetime, timezone as dt_timezone

from projects.models import Project
from scoring.constants import LeaderboardScoreTypes
from scoring.models import Leaderboard
from scoring.utils import update_project_leaderboard
from scoring.tasks import update_custom_leaderboard
from scoring.tasks import update_coherence_spring_2026_cup

from scoring.management.commands.update_global_bot_leaderboard import (
    run_update_global_bot_leaderboard,
)

logger = logging.getLogger(__name__)


def update_global_bot_leaderboard():
    global_bot_leaderboard = Leaderboard.objects.filter(
        name="Global Bot Leaderboard",
    ).first()
    if not global_bot_leaderboard:
        logger.warning("Global Bot Leaderboard not found.")
        return
    try:
        run_update_global_bot_leaderboard()
    except Exception as e:
        logger.error(f"Error updating Global Bot Leaderboard: {e}")


def update_global_comment_and_question_leaderboards():
    global_leaderboards = Leaderboard.objects.filter(
        finalized=False,
        score_type__in=[
            LeaderboardScoreTypes.COMMENT_INSIGHT,
            LeaderboardScoreTypes.QUESTION_WRITING,
        ],
    )
    for leaderboard in global_leaderboards:
        update_project_leaderboard(leaderboard=leaderboard)


def finalize_leaderboards():
    active_leaderboards = Leaderboard.objects.filter(finalized=False)
    for leaderboard in active_leaderboards:
        finalize_time = leaderboard.finalize_time or (
            leaderboard.project.close_date if leaderboard.project else None
        )
        if finalize_time and finalize_time <= timezone.now():
            logger.info(f"Finalizing leaderboard: {leaderboard}")
            update_project_leaderboard(leaderboard=leaderboard)


def update_custom_leaderboards():
    """
    Trigger the custom leaderboard updates.

    Leaderboards to update are hardcoded here.
    If adding more, be sure failures are handled gracefully.
    """

    # US Democracy Threat Index
    project = Project.objects.filter(
        slug="us-democracy-threat",
        type=Project.ProjectTypes.INDEX,
    ).first()
    if project:
        try:
            update_custom_leaderboard.send(
                project_id=project.id,
                minimum_timestamp=datetime(
                    2025, 12, 12, tzinfo=dt_timezone.utc
                ).timestamp(),
                spot_timestamps=None,
            )
            # TODO: add spot times as they become determined
            # update_custom_leaderboard(
            #     project_id=project.id,
            #     minimum_timestamp=None,
            #     spot_timestamps=[
            #         datetime(2026, 1, 1, tzinfo=dt_timezone.utc).timestamp()
            #     ],
            # )
        except Exception as e:
            logger.error(
                f"Error updating custom leaderboard for project "
                f"'{project.name}': {e}"
            )
    else:
        # don't warn or error because this project doesn't necessarily exist
        # in all environments
        logger.info("Index 'us-democracy-threat' not found.")

    # Coherence Links Tournament Metaculus Cup Spring 2026
    try:
        update_coherence_spring_2026_cup.send()
    except Exception as e:
        logger.error(
            f"Error updating Coherence Links Tournament Metaculus Cup Spring 2026: {e}"
        )
