from collections import defaultdict
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models.query import QuerySet

from users.models import User
from projects.models import Project
from questions.models import Question
from scoring.models import Score, LeaderboardEntry, Leaderboard
from scoring.score_math import evaluate_question
from utils.the_math.formulas import string_location_to_bucket_index


def score_question(
    question: Question,
    resolution: str,
    spot_forecast_time: datetime | None = None,
    score_types: list[str] | None = None,
):
    resolution_bucket = string_location_to_bucket_index(question, resolution)
    score_types = score_types or Score.ScoreTypes.choices
    for score_type in score_types:
        seen = set()
        previous_scores = list(
            Score.objects.filter(question=question, score_type=score_type)
        )
        new_scores = evaluate_question(
            question, resolution_bucket, score_type, spot_forecast_time
        )
        for new_score in new_scores:
            is_new = True
            for previous_score in previous_scores:
                if previous_score.user == new_score.user:
                    is_new = False
                    previous_score.score = new_score.score
                    previous_score.coverage = new_score.coverage
                    previous_score.save()
                    seen.add(previous_score)
                    break
            if is_new:
                new_score.question = question
                new_score.save()
        for previous_score in previous_scores:
            if previous_score not in seen:
                previous_score.delete()


def generate_scoring_leaderboard_entries(
    questions: list[Question],
    score_type: Leaderboard.ScoreTypes,
) -> list[LeaderboardEntry]:
    scores: QuerySet[Score] = Score.objects.filter(
        question__in=questions,
        score_type=Leaderboard.ScoreTypes.get_base_score(score_type),
    )
    user_entries: dict[User, LeaderboardEntry] = {}
    now = timezone.now()
    for score in scores:
        user_id = score.user_id
        if user_id not in user_entries:
            user_entries[user_id] = LeaderboardEntry(
                user_id=user_id,
                score=0,
                coverage=0,
                contribution_count=0,
                calculated_on=now,
            )
        user_entries[user_id].score += score.score
        user_entries[user_id].coverage += score.coverage
        user_entries[user_id].contribution_count += 1
    if score_type == Leaderboard.ScoreTypes.PEER_GLOBAL:
        for entry in user_entries.values():
            entry.score /= max(30, entry.coverage)
    elif score_type == Leaderboard.ScoreTypes.PEER_GLOBAL_LEGACY:
        for entry in user_entries.values():
            entry.score /= max(40, entry.contribution_count)
    return sorted(user_entries.values(), key=lambda entry: entry.score, reverse=True)


def generate_project_leaderboard(
    project: Project,
    leaderboard: Leaderboard | None = None,
) -> list[LeaderboardEntry]:
    """Calculates (does not save) LeaderboardEntries for a project."""

    leaderboard = leaderboard or project.primary_leaderboard
    if not leaderboard:
        raise ValueError("Leaderboard not found")

    leaderboard.project = project

    if leaderboard.score_type in [
        Leaderboard.ScoreTypes.COMMENT_INSIGHT,
        Leaderboard.ScoreTypes.QUESTION_WRITING,
    ]:
        # TODO
        return []
    # We have a scoring based leaderboard
    return generate_scoring_leaderboard_entries(
        leaderboard.get_questions(), leaderboard.score_type
    )


def update_project_leaderboard(
    project: Project,
    leaderboard: Leaderboard | None = None,
) -> list[LeaderboardEntry]:
    leaderboard = leaderboard or project.primary_leaderboard
    if not leaderboard:
        raise ValueError("Leaderboard not found")

    leaderboard.project = project
    leaderboard.save()

    seen = set()
    previous_entries = list(leaderboard.entries.all())
    new_entries = generate_project_leaderboard(project, leaderboard)

    # TODO: add medals & prize update logic here

    for new_entry in new_entries:
        is_new = True
        for previous_entry in previous_entries:
            if previous_entry.user == new_entry.user:
                is_new = False
                previous_entry.score = new_entry.score
                previous_entry.coverage = new_entry.coverage
                previous_entry.medal = new_entry.medal
                previous_entry.prize = new_entry.prize
                previous_entry.contribution_count = new_entry.contribution_count
                previous_entry.save()
                seen.add(previous_entry)
                break
        if is_new:
            new_entry.leaderboard = leaderboard
            new_entry.save()
    for previous_entry in previous_entries:
        if previous_entry not in seen:
            previous_entry.delete()
    return new_entries
