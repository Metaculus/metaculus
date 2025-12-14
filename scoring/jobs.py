import logging

from django.utils import timezone

from scoring.constants import LeaderboardScoreTypes
from scoring.models import Leaderboard
from scoring.utils import update_project_leaderboard

from scoring.management.commands.update_global_bot_leaderboard import (
    run_update_global_bot_leaderboard,
)

logger = logging.getLogger(__name__)


def update_gobal_bot_leaderboard():
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
