import asyncio
import logging
import re

import numpy as np
from asgiref.sync import async_to_sync
from django.contrib.postgres.search import SearchVector, SearchQuery
from django.db.models import Value, Case, When, FloatField, QuerySet, Q
from django.utils import timezone
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
    post.save(update_fields=["embedding_vector"])


def perform_post_search(qs, search_text: str):
    embedding_vector, semantic_scores_by_id = async_to_sync(gather_search_results)(
        search_text
    )
    semantic_scores_by_id = semantic_scores_by_id or {}

    semantic_whens = [
        When(id=key, then=Value(val)) for key, val in semantic_scores_by_id.items()
    ]

    # Annotating embedding vector distance
    qs = qs.filter(embedding_vector__isnull=False).annotate(
        rank=Case(
            *semantic_whens,
            default=1 - CosineDistance("embedding_vector", embedding_vector),
            output_field=FloatField(),
        )
        * Case(
            # Penalise closed and resolved questions in search by 10%
            When(
                Q(resolved=True) | Q(actual_close_time__lte=timezone.now()),
                then=Value(0.9),
            ),
            default=1,
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


def posts_full_text_search(qs: QuerySet[Post], query: str):
    """
    Performs a full-text search for posts.
    Note: This method is not highly optimized since search vectors are not stored in the database.
    Use with caution, especially when querying a large number of database rows!
    """

    def escape_tsquery(term: str) -> str:
        # Remove or escape characters that break raw tsquery
        # Postgres special characters:  ! ' & | ( ) : *
        return re.sub(r"[!\'&|():*]", " ", term)

    query = escape_tsquery(query)

    # Constructs a fuzzy search query by splitting the input query into individual words.
    # Each word is matched using a prefix search operator (":*"), enabling partial word matches.
    # Words are joined with an AND operator ("&") to combine search criteria.
    query = " & ".join(f"{word.strip()}:*" for word in query.split() if word.strip())

    search_vector = (
        SearchVector("questions__title")
        + SearchVector("questions__description")
        + SearchVector("questions__resolution_criteria")
        + SearchVector("questions__fine_print")
        + SearchVector("questions__options")
        + SearchVector("group_of_questions__description")
        + SearchVector("group_of_questions__resolution_criteria")
        + SearchVector("group_of_questions__fine_print")
    )

    return (
        qs.annotate(search=search_vector)
        .filter(search=SearchQuery(query, search_type="raw"))
        .distinct("pk")
    )
