from questions.models import Question
from scoring.utils import score_question
from scoring.models import Score


def score_questions(qty: int | None = None):
    questions = Question.objects.filter(
        resolution__isnull=False,
    )
    if qty:
        questions = questions.order_by("?")[:qty]
    c = len(questions)
    for i, question in enumerate(questions, 1):
        if question.resolution and not question.forecast_horizon_end:
            print(question.forecast_horizon_end, question.resolution)
            print("Resolved q with no resolved time")
            exit()
        score_question(
            question,
            question.resolution,
            # TODO: add spot_forecast_time
            score_types=[Score.ScoreTypes.PEER, Score.ScoreTypes.BASELINE],
        )
        print("scored question", i, "/", c, "ID:", question.id, end="\r")
    print()
