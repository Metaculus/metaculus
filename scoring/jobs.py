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
