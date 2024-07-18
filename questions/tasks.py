import dramatiq

from questions.models import Question
from questions.services import build_question_forecasts


@dramatiq.actor
def run_build_question_forecasts(question_id: int):
    """
    TODO: ensure tasks of this group are executed consequent and keep the FIFO order
        and implement a cancellation of previous task with the same type
    """

    question = Question.objects.get(id=question_id)
    forecasts = build_question_forecasts(question)

    question.composed_forecasts = forecasts

    try:
        question.save()
    except:
        raise
