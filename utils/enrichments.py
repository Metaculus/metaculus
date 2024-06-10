from typing import Callable

from django.db import models
from django.db.models import QuerySet


def enrich_empty(
    qs: QuerySet, *args, **kwargs
) -> tuple[QuerySet, Callable[[models.Model, dict], dict]]:
    """
    Enrichment function with returns everything as is
    """

    def enrich(obj: models.Model, serialized_obj: dict):
        return serialized_obj

    return qs, enrich
