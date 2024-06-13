from collections import defaultdict
from datetime import datetime, timezone

from projects.models import Project
from questions.models import Question
from scoring.models import LeaderboardEntry, Score


class KeyAwareDefaultDict(defaultdict):
    def __missing__(self, key):
        self[key] = value = self.default_factory(key)
        return value


def evaluate_score_based_leaderboard(
    project: Project, leaderboard_type: str | None = None
) -> list[LeaderboardEntry]:
    leaderboard_type = leaderboard_type or project.leaderboard_type
    scores = Score.objects.filter(
        for_question__post__projects=project, score_type=leaderboard_type
    )
    user_entries = KeyAwareDefaultDict(
        lambda user: LeaderboardEntry(
            user=user,
            for_project=project,
            leaderboard_type=leaderboard_type,
            score=0,
            coverage=0,
            contribution_count=0,
        )
    )
    for score in scores:
        user_entries[score.user].score += score.score
        user_entries[score.user].coverage += score.coverage
        user_entries[score.user].contribution_count += 1
    for entry in user_entries.values():
        if project.leaderboard_type == Project.LeaderboardTypes.PEER:
            if project.close_date > datetime(2024, 6, 1, tzinfo=timezone.utc):
                entry.score /= max(30, entry.coverage)
            else:
                entry.score /= max(40, entry.contribution_count)
    return sorted(user_entries.values(), key=lambda entry: entry.score, reverse=True)


def get_gobal_leaderboard_entries(project: Project) -> list[LeaderboardEntry]:
    if project.leaderboard_type == Project.LeaderboardTypes.QUESTION_WRITING:
        return []
    if project.leaderboard_type == Project.LeaderboardTypes.COMMENT_INSIGHT:
        return []
    return evaluate_score_based_leaderboard(project)


def evaluate_project_leaderboard(project: Project) -> list[LeaderboardEntry]:
    if project.type == Project.ProjectTypes.GLOBAL_LEADERBOARD:
        return get_gobal_leaderboard_entries(project)
    elif project.type == Project.ProjectTypes.TOURNAMENT:
        return []
    elif project.type == Project.ProjectTypes.QUESTION_SERIES:
        return []
    return []
