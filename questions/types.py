from django.db import models


class AggregationMethod(models.TextChoices):
    RECENCY_WEIGHTED = "recency_weighted"
    UNWEIGHTED = "unweighted"
    SINGLE_AGGREGATION = "single_aggregation"
    METACULUS_PREDICTION = "metaculus_prediction"
