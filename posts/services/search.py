import asyncio
import logging

from django.db.models import Value, Case, When, FloatField
from pgvector.django import CosineDistance

from utils.openai import generate_text_embed_vector_async
from utils.serper_google import get_google_search_results

logger = logging.getLogger(__name__)


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
