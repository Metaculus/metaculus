from django_dynamic_fixture import G

from questions.models import Question, Conditional, Forecast, GroupOfQuestions
from users.models import User
from utils.dtypes import setdefaults_not_null


def create_question(**kwargs) -> Question:
    """
    Question factory
    if "question" is given, will just update question with any additional properties
    """
    question_type = kwargs.pop("question_type", None)
    if question := kwargs.pop("question", None):
        for key, val in kwargs.items():
            setattr(question, key, val)
        question.type = question_type or question.type
        question.save()
    else:
        question = G(
            Question,
            **setdefaults_not_null(
                kwargs,
                type=question_type or Question.QuestionType.BINARY,
            ),
        )
    if not question.get_post():
        from tests.unit.test_posts.factories import factory_post

        factory_post(question=question)
    return question


def factory_group_of_questions(
    *, questions: list[Question] = None, **kwargs
) -> GroupOfQuestions:
    group_of_questions = G(
        GroupOfQuestions,
        **setdefaults_not_null(
            kwargs,
        ),
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
    **kwargs,
):
    return G(
        Conditional,
        **setdefaults_not_null(
            kwargs,
            condition=condition,
            condition_child=condition_child,
            question_yes=question_yes,
            question_no=question_no,
        ),
    )


def factory_forecast(*, author: User = None, question: Question = None, **kwargs):
    f = G(
        Forecast,
        **setdefaults_not_null(
            kwargs,
            author=author,
            question=question,
        ),
    )

    f.post.update_forecasts_count()
    return f
