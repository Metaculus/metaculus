from asgiref.sync import async_to_sync
from django.conf import settings
from django.db.models import Q
from django.utils.translation import override

from posts.models import Post
from posts.services.search import (
    SearchUnavailable,
    gather_search_results,
    generate_post_content_for_embedding_vectorization,
    perform_post_search,
)
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import (
    create_question,
    factory_group_of_questions,
)


def test_gather_search_results_returns_google_results_when_embedding_fails(
    monkeypatch,
):
    async def mock_generate_text_embed_vector_async(_search_text):
        raise RuntimeError("OpenAI quota exhausted")

    async def mock_perform_google_search(_search_text):
        return {123: 0.9}

    monkeypatch.setattr(
        "posts.services.search.generate_text_embed_vector_async",
        mock_generate_text_embed_vector_async,
    )
    monkeypatch.setattr(
        "posts.services.search.perform_google_search",
        mock_perform_google_search,
    )

    embedding_vector, google_scores = async_to_sync(gather_search_results)("test")

    assert embedding_vector is None
    assert google_scores == {123: 0.9}


def test_perform_post_search_returns_google_matches_without_embedding(monkeypatch):
    matching_post = factory_post()
    factory_post()

    async def mock_gather_search_results(_search_text):
        return None, {matching_post.id: 0.9}

    monkeypatch.setattr(
        "posts.services.search.gather_search_results",
        mock_gather_search_results,
    )

    posts = list(perform_post_search(Post.objects.all(), "test"))

    assert len(posts) == 1
    assert posts[0].id == matching_post.id
    assert posts[0].rank == 0.9


def test_perform_post_search_uses_full_text_when_providers_fail(monkeypatch):
    matching_post = factory_post()
    factory_post()

    async def mock_gather_search_results(_search_text):
        return None, None

    def mock_posts_full_text_search(qs, _search_text):
        return qs.filter(id=matching_post.id)

    monkeypatch.setattr(
        "posts.services.search.gather_search_results",
        mock_gather_search_results,
    )
    monkeypatch.setattr(
        "posts.services.search.posts_full_text_search",
        mock_posts_full_text_search,
    )

    posts = list(perform_post_search(Post.objects.all(), "test"))

    assert len(posts) == 1
    assert posts[0].id == matching_post.id
    assert posts[0].rank == 0.3


def test_perform_post_search_errors_when_all_search_paths_fail(monkeypatch):
    async def mock_gather_search_results(_search_text):
        return None, None

    def mock_posts_full_text_search(_qs, _search_text):
        raise RuntimeError("database search unavailable")

    monkeypatch.setattr(
        "posts.services.search.gather_search_results",
        mock_gather_search_results,
    )
    monkeypatch.setattr(
        "posts.services.search.posts_full_text_search",
        mock_posts_full_text_search,
    )

    try:
        perform_post_search(Post.objects.all(), "test")
    except SearchUnavailable as exc:
        assert exc.status_code == 503
    else:
        raise AssertionError("Expected SearchUnavailable")


def test_perform_post_search_returns_empty_when_google_succeeds_with_no_results(
    monkeypatch,
):
    async def mock_gather_search_results(_search_text):
        return None, {}

    monkeypatch.setattr(
        "posts.services.search.gather_search_results",
        mock_gather_search_results,
    )

    qs = perform_post_search(Post.objects.all(), "test")

    assert not qs.exists()
    # qs must expose `rank` so downstream `.filter(Q(rank__gte=...))` works
    assert not qs.filter(Q(rank__gte=0.3)).exists()


# update_post builds this content in the original language
@override(settings.ORIGINAL_LANGUAGE_CODE)
def test_generate_post_content_for_embedding_vectorization__group(user1):
    post = factory_post(
        author=user1,
        title_original="Group",
        group_of_questions=factory_group_of_questions(
            description_original="Description",
            resolution_criteria_original="Criteria",
            fine_print_original="Fine print",
        ),
    )
    for label in ("A", "B"):
        create_question(
            title_original=f"Group ({label})",
            question_type=Question.QuestionType.BINARY,
            group=post.group_of_questions,
            description_original="",
            resolution_criteria_original="",
            fine_print_original="",
        )

    chunks = generate_post_content_for_embedding_vectorization(post).split("\n\n")

    assert chunks[:2] == ["Group", "Description\nCriteria"]
    assert sorted(chunks[2:]) == ["Group (A)", "Group (B)"]


@override(settings.ORIGINAL_LANGUAGE_CODE)
def test_generate_post_content_for_embedding_vectorization__question(user1):
    post = factory_post(
        author=user1,
        title_original="Post",
        question=create_question(
            title_original="Question",
            question_type=Question.QuestionType.BINARY,
            description_original="Description",
            resolution_criteria_original="Criteria",
            fine_print_original="Fine print",
        ),
    )

    assert (
        generate_post_content_for_embedding_vectorization(post)
        == "Post\n\nQuestion\nDescription\nCriteria"
    )
