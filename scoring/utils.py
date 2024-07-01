from datetime import datetime, timedelta
from django.utils import timezone

from projects.models import Project
from questions.models import Question
from scoring.models import Score
from scoring.score_math import evaluate_question
from scoring.leaderboard_math import evaluate_score_based_leaderboard
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


def create_leaderboard_entries(
    project: Project, leaderboard_type: str | None = None, live: bool = True
):
    seen = set()
    previous_entries = list(project.leaderboard_entries.all())
    # Bit of a dirty hack but tl;dr "If this was generated recently don't bother !"
    if not live:
        for entry in previous_entries:
            if entry.edited_at > timezone.now() - timedelta(days=1):
                return

    if not leaderboard_type:
        leaderboard_type = project.leaderboard_type
    if leaderboard_type is None:
        raise Exception("Trying to generate leaderboard without a type!")

    new_entries = evaluate_score_based_leaderboard(project, leaderboard_type)
    for new_entry in new_entries:
        is_new = True
        for previous_entry in previous_entries:
            if previous_entry.user == new_entry.user:
                is_new = False
                previous_entry.score = new_entry.score
                previous_entry.coverage = new_entry.coverage
                previous_entry.medal = new_entry.medal
                previous_entry.contribution_count = new_entry.contribution_count
                previous_entry.save()
                seen.add(previous_entry)
                break
        if is_new:
            new_entry.project = project
            new_entry.save()
    for previous_entry in previous_entries:
        if previous_entry not in seen:
            previous_entry.delete()
