import numpy as np
from typing import TypeAlias, TypeVar
from django.db import models

ForecastValues = np.ndarray | list[float]  # values from a single forecast
ForecastsValues = np.ndarray | list[ForecastValues]  # values from multiple forecasts
Weights = np.ndarray | None
Percentiles: TypeAlias = np.ndarray

# Taken from https://github.com/HackSoftware/Django-Styleguide-Example
# Generic type for a Django model
DjangoModelType = TypeVar("DjangoModelType", bound=models.Model)
