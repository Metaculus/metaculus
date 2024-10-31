from django_dynamic_fixture import G

from posts.models import Post, PostUserSnapshot
from projects.models import Project
from projects.services.common import get_site_main_project
from questions.models import Question, Conditional
from users.models import User
from utils.dtypes import setdefaults_not_null


def factory_post(
    *,
    author: User = None,
    question: Question = None,
    conditional: Conditional = None,
    projects: list[Project] = None,
    default_project: Project = None,
    curation_status: Post.CurationStatus = Post.CurationStatus.APPROVED,
    **kwargs
):
    projects = projects or []
    default_project = default_project or get_site_main_project()

    post = G(
        Post,
        **setdefaults_not_null(
            kwargs,
            author=author,
            question=question,
            conditional=conditional,
            default_project=default_project,
            curation_status=curation_status,
        )
    )
    post.projects.add(*projects)

    return post


def factory_post_snapshot(*, user: User = None, post: Post = None, **kwargs):
    return G(
        PostUserSnapshot,
        **setdefaults_not_null(
            kwargs,
            user=user,
            post=post,
        )
    )
