from typing import TypedDict

from django.db import models
from django.db.models import TextChoices


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
    MEDALISTS = "medalists"
    EXPERIENCED_USERS_25_RESOLVED = "experienced_users_25_resolved"
    IGNORANCE = "ignorance"
    RECENCY_WEIGHTED_LOG_ODDS = "recency_weighted_log_odds"
    RECENCY_WEIGHTED_MEAN_NO_OUTLIERS = "recency_weighted_mean_no_outliers"
    RECENCY_WEIGHTED_MEDALISTS = "recency_weighted_medalists"
    RECENCY_WEIGHTED_EXPERIENCED_USERS_25_RESOLVED = (
        "recency_weighted_experienced_users_25_resolved"
    )
    RECENCY_WEIGHTED_LOG_ODDS_NO_OUTLIERS = "recency_weighted_log_odds_no_outliers"


QuestionMovement = TypedDict(
    "QuestionMovement", {"direction": Direction, "movement": float}
)
