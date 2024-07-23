from logging import getLogger

import aiohttp
from django.conf import settings

logger = getLogger(__name__)

DEFAULT_GOOGLE_SCORES_FROM = 0.87
DEFAULT_GOOGLE_SCORES_TO = 0.9
DEFAULT_URL_POSTFIXES = {"questions", "notebooks"}


async def get_google_search_results(
    search_query: str,
    max_pages: int = 1,
    url_postfixes: set[str] | None = None,
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
        url_postfixes: Only consider URLs with these postfixes.
                       E.g. https://www.metaculus.com/{postfix}/123456/
    """
    if url_postfixes is None:
        url_postfixes = DEFAULT_URL_POSTFIXES
    try:
        return await _get_google_search_results(
            search_query=search_query,
            max_pages=max_pages,
            url_postfixes=url_postfixes,
        )
    except Exception as e:
        logger.warning(
            f"Failed to get Google search results for query '{search_query}': {e}"
        )
        raise e


async def _get_google_search_results(
    search_query: str,
    max_pages: int,
    url_postfixes: set[str],
) -> dict[int, float]:
    results = await _get_serper_results(search_query, max_pages)
    question_ids = []
    for result in results:
        # URL format: https://www.metaculus.com/{postfix}/123456/
        # Parts: 0: https, 1: "", 2: www.metaculus.com, 3: {postfix}, 4: 123456, 5: ""
        link_parts = result["link"].split("/")
        if len(link_parts) < 5:
            continue
        if link_parts[3] not in url_postfixes:
            continue
        if not link_parts[4].isnumeric():
            continue
        question_ids.append(int(link_parts[4]))
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
        question_id_to_score[question_id] = DEFAULT_GOOGLE_SCORES_TO - (
            i / len(question_ids)
        ) * (DEFAULT_GOOGLE_SCORES_TO - DEFAULT_GOOGLE_SCORES_FROM)
    return question_id_to_score
