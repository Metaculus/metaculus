from django.utils import timezone

from scoring.models import Leaderboard
from scoring.utils import update_project_leaderboard


def update_global_comment_and_question_leaderboards():
    global_leaderboards = Leaderboard.objects.filter(
        finalized=False,
        score_type__in=[
            Leaderboard.ScoreTypes.COMMENT_INSIGHT,
            Leaderboard.ScoreTypes.QUESTION_WRITING,
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
            print("Finalizing leaderboard: ", leaderboard)
            update_project_leaderboard(leaderboard=leaderboard)
