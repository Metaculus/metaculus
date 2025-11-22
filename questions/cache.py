from typing import Iterable

from django.core.cache import cache

from questions.models import Question


def average_coverage_cache_key(question: Question) -> str:
    """
    Generate cache key for average coverage per question.
    """

    return f"average_coverage_for_question:{question.id}"


def invalidate_average_coverage_cache(questions: Iterable[Question]) -> None:
    """
    Invalidate the average coverage cache for specific questions.
    """

    cache_keys = [average_coverage_cache_key(q) for q in questions]
    cache.delete_many(cache_keys)
