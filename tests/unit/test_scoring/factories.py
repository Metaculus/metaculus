from django_dynamic_fixture import G

from questions.models import Question
from scoring.models import Score
from users.models import User
from utils.dtypes import setdefaults_not_null


def factory_score(*, user: User = None, question: Question = None, **kwargs):
    f = G(
        Score,
        **setdefaults_not_null(
            kwargs,
            user=user,
            question=question,
        )
    )

    return f
