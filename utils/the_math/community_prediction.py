'''
Ftr, the general shape of the aggregation is:
Everytime a new prediction is made, take the latest prediction of each user.
For each of those user-predictions, compute a reputation weight and a recency weight, then combine them to get a weight for the user-prediction.
Transform the predictions to logodds.
For each possible outcome, take the weighted average of all user-prediction logodds.
Transform back to probabilities.
Normalise to 1 over all outcomes.
'''
from datetime import datetime
from typing import Optional
from questions.models import Forecast
from collections import defaultdict
import numpy as np


def latest_forecasts_at(forecasts: list[Forecast], at_datetime: Optional[datetime]) -> int:
    if at_datetime:
        forecasts = [f for f in forecasts if f.start_time <= at_datetime]

    user_latest_forecasts = defaultdict(lambda: None)
    for forecast in forecasts:
        if user_latest_forecasts[forecast.author_id] is None or forecast.start_time > user_latest_forecasts[forecast.author_id].start_time:
            user_latest_forecasts[forecast.author_id] = forecast

    return list(user_latest_forecasts.values())

def compute_binary_cp(forecasts: list[Forecast], at_datetime: Optional[datetime]) -> int:
    forecasts = latest_forecasts_at(forecasts, at_datetime)
    probabilities = [x.probability_yes for x in forecasts]
    return {
        "mean": np.mean(probabilities),
        "max": np.percentile(probabilities, 80),
        "min": np.percentile(probabilities, 20),
        "nr_forecasters": len(forecasts)
    }
