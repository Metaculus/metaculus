from questions.models import Question
from scoring.utils import score_question
from scoring.models import Score


def score_questions(qty: int | None = None):
    questions = Question.objects.filter(
        resolution__isnull=False,
        post__isnull=False,  # this shouldn't be necessary
    )
    if qty:
        questions = questions.order_by("?")[:qty]
    c = len(questions)
    for i, question in enumerate(questions, 1):
        score_question(
            question,
            question.resolution,
            question.resolved_at,
            # TODO: add spot_forecast_time
            score_types=[Score.ScoreTypes.PEER, Score.ScoreTypes.BASELINE],
        )
        print("scored question", i, "/", c, "ID:", question.id, end="\r")
    print()
