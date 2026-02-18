import numpy as np
from typing import TypeAlias

ForecastValues = np.ndarray | list[float]  # values from a single forecast
ForecastsValues = np.ndarray | list[ForecastValues]  # values from multiple forecasts
Weights = np.ndarray | None
Percentiles: TypeAlias = np.ndarray
