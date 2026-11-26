from django.db import connection
from django.test.utils import CaptureQueriesContext

from posts.serializers import serialize_post_many
from tests.unit.test_posts.factories import factory_notebook, factory_post


def test_author_username_without_user_row(post_binary_public):
    with CaptureQueriesContext(connection) as ctx:
        data = serialize_post_many([post_binary_public.id])

    assert data[0]["author_username"] == "user1"
    assert not [q for q in ctx.captured_queries if '."password"' in q["sql"]]


def test_conditionals_and_notebooks_load_outside_main_query(
    user1, post_binary_public, conditional_1, django_assert_num_queries
):
    conditional_post = factory_post(author=user1, conditional=conditional_1)
    notebook_post = factory_post(
        author=user1, notebook=factory_notebook(markdown_original="Notebook")
    )
    ids = [post_binary_public.id, conditional_post.id, notebook_post.id]

    with django_assert_num_queries(3) as ctx:
        serialize_post_many([post_binary_public.id])

    assert '"questions_conditional"' not in ctx.captured_queries[0]["sql"]
    assert '"posts_notebook"' not in ctx.captured_queries[0]["sql"]

    with django_assert_num_queries(5):
        data = serialize_post_many(ids)

    assert data[1]["conditional"]["question_yes"]["id"] == conditional_1.question_yes_id
    assert data[2]["notebook"]["markdown"] == "Notebook"

    with django_assert_num_queries(28):
        serialize_post_many(
            ids, current_user=user1, with_cp=True, include_user_forecasts=True
        )
