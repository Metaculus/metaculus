from django.db import connection
from django.test.utils import CaptureQueriesContext

from posts.serializers import serialize_post_many
from projects.models import Project
from tests.unit.test_posts.factories import factory_notebook, factory_post
from tests.unit.test_projects.factories import factory_project


def test_conditionals_and_notebooks_load_outside_main_query(
    user1, post_binary_public, conditional_1, django_assert_num_queries
):
    # Conditionals are only shown when their condition questions' posts are viewable
    # (post_binary_public already holds the condition question)
    factory_post(author=user1, question=conditional_1.condition_child)
    conditional_post = factory_post(author=user1, conditional=conditional_1)
    notebook_post = factory_post(
        author=user1, notebook=factory_notebook(markdown_original="Notebook")
    )
    ids = [post_binary_public.id, conditional_post.id, notebook_post.id]

    with django_assert_num_queries(4) as ctx:
        serialize_post_many([post_binary_public.id])

    assert '"questions_conditional"' not in ctx.captured_queries[0]["sql"]
    assert '"posts_notebook"' not in ctx.captured_queries[0]["sql"]

    with django_assert_num_queries(7):
        data = serialize_post_many(ids)

    assert data[1]["conditional"]["question_yes"]["id"] == conditional_1.question_yes_id
    assert data[2]["notebook"]["markdown"] == "Notebook"

    with django_assert_num_queries(30):
        serialize_post_many(
            ids, current_user=user1, with_cp=True, include_user_forecasts=True
        )


def test_default_project_loads_outside_main_query(user1):
    project = factory_project(type=Project.ProjectTypes.TOURNAMENT)
    ids = [factory_post(author=user1, default_project=project).id for _ in range(3)]

    with CaptureQueriesContext(connection) as ctx:
        data = serialize_post_many(ids)

    assert '"projects_project"."description' not in ctx.captured_queries[0]["sql"]
    assert {post["projects"]["default_project"]["id"] for post in data} == {project.id}
