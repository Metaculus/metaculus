from dataclasses import dataclass
from datetime import datetime

from django.db.models import QuerySet, F
from scoring.models import Score


@dataclass(frozen=True)
class QuestionScore:
    """
    Lightweight dataclass representing a Score of a Question
    """

    score: float
    question_id: int
    post_id: int
    question_title: str
    question_resolution: str | None = None
    edited_at: datetime | None = None


def generate_question_scores(qs: QuerySet[Score]):
    # Some old users might have a lot of score
    # So we want to save time on db model serialization and select only values we actually use
    scores_qs = qs.annotate(
        question_title=F("question__title"),
        question_resolution=F("question__resolution"),
        post_id=F("question__related_posts__post_id"),
    ).values(
        "score",
        "edited_at",
        "question_id",
        "question_title",
        "question_resolution",
        "post_id",
    )
    scores = [QuestionScore(**x) for x in scores_qs]

    return scores
