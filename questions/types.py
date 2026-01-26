from typing import TypedDict

from django.db import models
from django.db.models import TextChoices

OptionsHistoryType = list[tuple[str, list[str]]]


class Direction(TextChoices):
    UNCHANGED = "unchanged"
    UP = "up"
    DOWN = "down"
    EXPANDED = "expanded"
    CONTRACTED = "contracted"
    CHANGED = "changed"  # failsafe


class AggregationMethod(models.TextChoices):
    RECENCY_WEIGHTED = "recency_weighted"
    UNWEIGHTED = "unweighted"
    SINGLE_AGGREGATION = "single_aggregation"
    METACULUS_PREDICTION = "metaculus_prediction"


QuestionMovement = TypedDict(
    "QuestionMovement", {"direction": Direction, "movement": float}
)
