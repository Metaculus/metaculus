from django_dynamic_fixture import G

from posts.models import Post
from projects.models import Project
from questions.models import Question, Conditional
from users.models import User
from utils.dtypes import setdefaults_not_null


def factory_post(
    *,
    author: User = None,
    question: Question = None,
    conditional: Conditional = None,
    projects: list[Project] = None,
    **kwargs
):
    projects = projects or []

    post = G(
        Post,
        **setdefaults_not_null(
            kwargs,
            author=author,
            question=question,
            conditional=conditional,
        )
    )
    post.projects.add(*projects)

    return post
