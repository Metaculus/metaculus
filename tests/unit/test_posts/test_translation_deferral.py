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
        default_project=factory_project(
            type=Project.ProjectTypes.TOURNAMENT,
            content_original_lang="en",
            **localized("name", original="T", es="T es", zh="T zh"),
            **localized("description", original="TD", cs="TD cs", en=""),
            **localized("subtitle", original="TS", pt="TS pt"),
        ),
        projects=[
            factory_project(
                content_original_lang="es",
                **localized("name", original="C", en="C en"),
                **localized("description", original="CD", zh_TW="CD zh-TW"),
            )
        ],
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
        project_queries = [
            q["sql"]
            for q in ctx.captured_queries
            if 'FROM "projects_project"' in q["sql"]
        ]
        assert len(project_queries) == 2
        assert all(
            '"projects_project"."description",' not in sql for sql in project_queries
        )

        for target in ("posts.serializers", "projects.services.common"):
            mocker.patch(
                f"{target}.defer_unused_translations",
                side_effect=lambda queryset, *related: queryset,
            )
        with CaptureQueriesContext(connection) as full_ctx:
            expected = serialize_post_many(
                ids, include_descriptions=include_descriptions
            )

    assert data == expected
    assert len(ctx.captured_queries) == len(full_ctx.captured_queries)
