import numpy as np

ForecastValues = np.ndarray | list[float]  # values from a single forecast
ForecastsValues = np.ndarray | list[list[float]]  # values from multiple forecasts
Weights = np.ndarray | list[float]
Percentiles = np.ndarray | list[float]
