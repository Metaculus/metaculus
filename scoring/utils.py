from datetime import datetime

from projects.models import Project
from questions.models import Question
from scoring.models import Score
from scoring.score_math import evaluate_question
from scoring.leaderboard_math import evaluate_score_based_leaderboard
from utils.the_math.formulas import string_location_to_bucket_index


def score_question(
    question: Question,
    resolution: str,
    resolution_time: float,
    spot_forecast_time: datetime | None = None,
    score_types: list[str] | None = None,
):
    resolution_bucket = string_location_to_bucket_index(question, resolution)
    question.resolved_at = resolution_time
    score_types = score_types or Score.ScoreTypes.choices
    for score_type in score_types:
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
                    previous_score.save()
                    break
            if is_new:
                new_score.question = question
                new_score.save()


def create_leaderboard_entries(project: Project, leaderboard_type: str | None = None):
    previous_entries = list(project.leaderboard_entries.all())
    leaderboard_type = leaderboard_type or project.leaderboard_type
    new_entries = evaluate_score_based_leaderboard(project, leaderboard_type)
    for new_entry in new_entries:
        is_new = True
        for previous_entry in previous_entries:
            if previous_entry.user == new_entry.user:
                is_new = False
                previous_entry.score = new_entry.score
                previous_entry.save()
                break
        if is_new:
            new_entry.project = project
            new_entry.save()
