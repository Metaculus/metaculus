from logging import getLogger

import aiohttp
from django.conf import settings
import re

logger = getLogger(__name__)

DEFAULT_GOOGLE_SCORES_FROM = 0.87
DEFAULT_GOOGLE_SCORES_TO = 0.9

METACULUS_URL_PATTERN = (
    r"https?://(?:www\.)?metaculus\.com/(?:questions|c/[^/]+|notebooks?)/(\d+)(?:/|$)"
)


async def get_google_search_results(
    search_query: str, max_pages: int = 1
) -> dict[int, float]:
    """
    Returns a dictionary mapping question IDs to scores based on Google search results.
    The scores are linearly normalized between DEFAULT_GOOGLE_SCORES_FROM and
    DEFAULT_GOOGLE_SCORES_TO, based on the position of the question
    in the Google search results.
    Raises an exception if the Google search fails.
    Args:
        search_query: The search query to use.
        max_pages: The maximum number of Google pages to search.
                   Each page contains 100 results.
    """
    try:
        return await _get_google_search_results(
            search_query=search_query, max_pages=max_pages
        )
    except Exception as e:
        logger.warning(
            f"Failed to get Google search results for query '{search_query}': {e}"
        )
        raise e


async def _get_google_search_results(
    search_query: str,
    max_pages: int,
) -> dict[int, float]:
    results = await _get_serper_results(search_query, max_pages)
    question_ids = []
    for result in results:
        if match := re.match(METACULUS_URL_PATTERN, result["link"]):
            question_ids.append(int(match.group(1)))

    question_id_to_score = _normalize_google_scores(
        question_ids=question_ids,
    )
    return question_id_to_score


async def _get_serper_results(
    search_query: str,
    max_pages: int,
) -> list[dict]:
    results: list[dict] = []
    for _ in range(max_pages):
        url = "https://google.serper.dev/search"
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers={
                    "X-API-KEY": settings.SERPER_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "q": f"site:metaculus.com {search_query}",
                    "gl": "us",
                    "hl": "en",
                    # Number of results to get
                    # 1-10 costs 1 credit, 11-100 costs 2 credits
                    "num": 10,
                },
            ) as response:
                response_json = await response.json()
        if not response_json["organic"]:
            break
        results += response_json["organic"]
    return results


def _normalize_google_scores(
    question_ids: list[int],
):
    question_id_to_score: dict[int, float] = {}
    for i, question_id in enumerate(question_ids):
        if question_id_to_score.get(question_id, None) is not None:
            # Don't overwrite existing scores with a lower one
            continue

        question_id_to_score[question_id] = DEFAULT_GOOGLE_SCORES_TO - (
            i / len(question_ids)
        ) * (DEFAULT_GOOGLE_SCORES_TO - DEFAULT_GOOGLE_SCORES_FROM)
    return question_id_to_score
