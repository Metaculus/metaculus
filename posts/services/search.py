import asyncio
import logging

import numpy as np
from django.db.models import Value, Case, When, FloatField, QuerySet
from pgvector.django import CosineDistance

from posts.models import Post
from utils.openai import (
    generate_text_embed_vector_async,
    chunked_tokens,
    generate_text_embed_vector,
)
from utils.serper_google import get_google_search_results

logger = logging.getLogger(__name__)


def generate_post_content_for_embedding_vectorization(post: Post):
    """
    Generates a composed Post content to be indexed by openai
    """

    question_chunks = []
    notebook_content = None

    for question in post.get_questions():
        chunks = [
            question.title,
            question.description,
            question.resolution_criteria,
            question.fine_print,
        ]
        question_chunks.append("\n".join([x for x in chunks if x]))

    questions_content = "\n\n".join(question_chunks)

    if post.notebook:
        notebook_content = post.notebook.markdown

    # Ensure we won't duplicate titles
    if post.title == questions_content:
        questions_content = None

    post_chunks = [post.title, questions_content, notebook_content]

    return "\n\n".join([x for x in post_chunks if x])


def update_post_search_embedding_vector(post: Post):
    content = generate_post_content_for_embedding_vectorization(post)
    chunk_embeddings = []

    # Step 1: generate embedding chunks
    for chunk in chunked_tokens(content):
        chunk_embeddings.append(generate_text_embed_vector(chunk))

    # Step 2: weight them
    vector = np.average(
        chunk_embeddings, axis=0, weights=[len(ch) for ch in chunk_embeddings]
    )

    post.embedding_vector = vector
    post.save()


def perform_post_search(qs, search_text: str):
    embedding_vector, semantic_scores_by_id = asyncio.run(
        gather_search_results(search_text)
    )
    semantic_scores_by_id = semantic_scores_by_id or {}

    semantic_whens = [
        When(id=key, then=Value(val)) for key, val in semantic_scores_by_id.items()
    ]

    # Annotating embedding vector distance
    qs = qs.annotate(
        rank=Case(
            *semantic_whens,
            default=1 - CosineDistance("embedding_vector", embedding_vector),
            output_field=FloatField(),
        )
    )

    return qs


async def gather_search_results(
    search_text: str,
) -> tuple[list[float], dict[int, float]]:
    return await asyncio.gather(
        generate_text_embed_vector_async(search_text),
        perform_google_search(search_text),
    )


async def perform_google_search(
    search_text: str,
) -> dict[int, float]:
    """
    Returns a dict of question IDs to Google scores.
    """
    try:
        return await get_google_search_results(
            search_query=search_text,
        )
    except Exception:
        logger.exception("Failed to perform google search")


def _qs_filter_similar_posts(qs: QuerySet[Post], embedding_vector):
    return qs.annotate(
        rank=1 - CosineDistance("embedding_vector", embedding_vector)
    ).filter(rank__isnull=False)


def qs_filter_similar_posts(qs: QuerySet[Post], post: Post):
    return _qs_filter_similar_posts(qs, post.embedding_vector).exclude(pk=post.pk)


def get_similar_posts_for_multiple_posts(posts: list[Post]):
    """
    Generates similar posts for multiple posts.
    """

    posts_with_embeddings = [
        ch.embedding_vector for ch in posts if ch.embedding_vector is not None
    ]

    if not posts_with_embeddings:
        return []

    vector = np.average(
        posts_with_embeddings,
        axis=0,
        weights=[len(x) for x in posts_with_embeddings],
    )

    return (
        _qs_filter_similar_posts(
            Post.objects.filter_public().filter_active().filter_questions(), vector
        )
        .exclude(pk__in=[p.pk for p in posts])
        .order_by("-rank")
    )
