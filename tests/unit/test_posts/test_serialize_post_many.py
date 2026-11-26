import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import translation

from posts.serializers import serialize_post_many
from projects.models import Project
from questions.models import Question
from tests.unit.test_posts.factories import factory_notebook, factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question


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

    with django_assert_num_queries(4) as ctx:
        serialize_post_many([post_binary_public.id])

    assert '"questions_conditional"' not in ctx.captured_queries[0]["sql"]
    assert '"posts_notebook"' not in ctx.captured_queries[0]["sql"]

    with django_assert_num_queries(6):
        data = serialize_post_many(ids)

    assert data[1]["conditional"]["question_yes"]["id"] == conditional_1.question_yes_id
    assert data[2]["notebook"]["markdown"] == "Notebook"

    with django_assert_num_queries(29):
        serialize_post_many(
            ids, current_user=user1, with_cp=True, include_user_forecasts=True
        )


def test_default_project_preview_without_description_columns(user1):
    project = factory_project(
        type=Project.ProjectTypes.TOURNAMENT, description_original=" \n" + "x" * 200
    )
    post = factory_post(author=user1, default_project=project)

    with translation.override("original"), CaptureQueriesContext(connection) as ctx:
        data = serialize_post_many([post.id])

    assert data[0]["projects"]["default_project"]["description_preview"] == "x" * 140
    assert not [
        q
        for q in ctx.captured_queries
        if '"projects_project"."description_cs"' in q["sql"]
    ]


def localized(field: str, **values) -> dict:
    return {f"{field}_{lang}": value for lang, value in values.items()}


@pytest.mark.parametrize("include_descriptions", [True, False])
@pytest.mark.parametrize(
    "language", ["original", "en", "es", "cs", "pt", "zh", "zh-TW", "en-us"]
)
def test_post_query_skips_unused_translation_columns(
    user1, mocker, language, include_descriptions
):
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        content_original_lang="en",
        **localized("title", original="Q", es="", cs="Q cs", zh_TW="Q zh-TW"),
        **localized("label", original="L", zh=None, pt="L pt"),
        **localized("description", original="D", en="", es="D es", zh="D zh"),
        **localized("resolution_criteria", original="R", cs="R cs"),
        **localized("fine_print", en="F en"),
    )
    post = factory_post(
        author=user1,
        question=question,
        content_original_lang="en",
        **localized("title", original="P", es="P es", zh="P zh"),
        **localized("short_title", original="S", pt="S pt", zh_TW="S zh-TW"),
    )
    notebook_post = factory_post(
        author=user1,
        notebook=factory_notebook(
            content_original_lang="es",
            **localized("markdown", original="M", cs="M cs", zh="M zh"),
            **localized("feed_tile_summary", original="T", es="T es"),
        ),
    )
    ids = [post.id, notebook_post.id]

    with translation.override(language):
        with CaptureQueriesContext(connection) as ctx:
            data = serialize_post_many(ids, include_descriptions=include_descriptions)

        assert '"posts_post"."title",' not in ctx.captured_queries[0]["sql"]
        assert (
            '"questions_question"."description",' not in ctx.captured_queries[0]["sql"]
        )

        mocker.patch(
            "posts.serializers.defer_unused_translations",
            side_effect=lambda queryset, *related: queryset,
        )
        with CaptureQueriesContext(connection) as full_ctx:
            expected = serialize_post_many(
                ids, include_descriptions=include_descriptions
            )

    assert data == expected
    assert len(ctx.captured_queries) == len(full_ctx.captured_queries)
