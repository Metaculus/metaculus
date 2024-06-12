from datetime import datetime

from questions.models import Question
from utils.the_math.formulas import string_location_to_bucket_index
from scoring.models import Score, LeaderboardEntry
from scoring.the_math import evaluate_question


def score_question(
    self,
    question: Question,
    resolution: str,
    resolution_time: float,
    spot_forecast_time: datetime | None = None,
):
    resolution_bucket = string_location_to_bucket_index(
        question.type, resolution, question.options
    )
    question.resolved_at = resolution_time
    # for score_type in LeaderboardEntry.LeaderboardType.choices:
    for score_type in ["baseline_accuracy"]:
        # only for forecast score types
        print("evaluating", score_type)
        previous_scores = list(
            Score.objects.filter(for_question=question, score_type=score_type)
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
                    print("updated_previous_score", previous_score.user.username)
                    break
            if is_new:
                new_score.for_question = question
                new_score.save()
