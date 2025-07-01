from django_dynamic_fixture import G

from questions.models import Question, Conditional, Forecast, GroupOfQuestions
from users.models import User
from utils.dtypes import setdefaults_not_null


def create_question(
    *, question_type: Question.QuestionType | str, **kwargs
) -> Question:
    """
    Question factory
    """

    return G(Question, **setdefaults_not_null(kwargs, type=question_type))


def factory_group_of_questions(
    *, questions: list[Question] = None, **kwargs
) -> GroupOfQuestions:
    group_of_questions = G(
        GroupOfQuestions,
        **setdefaults_not_null(
            kwargs,
        )
    )

    questions = questions or []
    for question in questions:
        question.group = group_of_questions

    Question.objects.bulk_update(questions, ["group"])

    return group_of_questions


def create_conditional(
    *,
    condition: Question = None,
    condition_child: Question = None,
    question_yes: Question = None,
    question_no: Question = None,
    **kwargs
):
    return G(
        Conditional,
        **setdefaults_not_null(
            kwargs,
            condition=condition,
            condition_child=condition_child,
            question_yes=question_yes,
            question_no=question_no,
        )
    )


def factory_forecast(*, author: User = None, question: Question = None, **kwargs):
    f = G(
        Forecast,
        **setdefaults_not_null(
            kwargs,
            author=author,
            question=question,
        )
    )

    f.post.update_forecasts_count()
    return f
