"""Equivalence tests for `get_user_forecast_history`'s sweep-based
implementation against the original per-forecast-slice implementation it
replaced (kept here as `_legacy_get_user_forecast_history`, verbatim, purely
as a reference oracle for these tests - it is not used anywhere else).
"""

import random
from bisect import bisect_left
from datetime import datetime, timedelta, timezone as dt_timezone

from questions.models import Forecast
from utils.the_math.aggregations import (
    ForecastSet,
    get_user_forecast_history,
    minimize_history,
)


def _legacy_get_user_forecast_history(
    forecasts,
    minimize=False,
    latest_time=None,
    earliest_time=None,
):
    if latest_time and earliest_time and latest_time <= earliest_time:
        return []
    timestep_set = set()
    for forecast in forecasts:
        if (
            earliest_time and forecast.end_time and forecast.end_time <= earliest_time
        ) or (latest_time and forecast.start_time > latest_time):
            continue
        timestep_set.add(
            max(forecast.start_time, earliest_time)
            if earliest_time
            else forecast.start_time
        )
        if forecast.end_time and (not latest_time or forecast.end_time <= latest_time):
            timestep_set.add(forecast.end_time)
    timesteps = sorted(timestep_set)
    if minimize > 1:
        timesteps = minimize_history(timesteps, minimize)
    elif minimize:
        timesteps = minimize_history(timesteps)
    forecast_sets = {
        timestep: ForecastSet(
            forecasts_values=[],
            timestep=timestep,
            forecaster_ids=[],
            timesteps=[],
        )
        for timestep in timesteps
    }
    for forecast in forecasts:
        start_index = bisect_left(timesteps, forecast.start_time)
        end_index = (
            bisect_left(timesteps, forecast.end_time)
            if forecast.end_time
            else len(timesteps)
        )
        forecast_values = forecast.get_prediction_values()
        for timestep in timesteps[start_index:end_index]:
            forecast_sets[timestep].forecasts_values.append(forecast_values)
            forecast_sets[timestep].forecaster_ids.append(forecast.author_id)
            forecast_sets[timestep].timesteps.append(forecast.start_time)

    return sorted(list(forecast_sets.values()), key=lambda x: x.timestep)


def _fake_forecast(id_, author_id, start_time, end_time, probability_yes):
    # An unsaved, in-memory Forecast: get_prediction_values() only touches
    # local scalar fields, so no DB/related objects are needed.
    return Forecast(
        id=id_,
        author_id=author_id,
        start_time=start_time,
        end_time=end_time,
        probability_yes=probability_yes,
    )


def _normalize(forecast_sets: list[ForecastSet]):
    """Order-independent view of a forecast history: for each timestep, the
    sorted set of (author_id, prediction_values, forecast_start_time) triples
    active at that timestep. Internal list order isn't semantically
    meaningful (aggregation math is a permutation-invariant reduction), so
    comparisons must ignore it.
    """
    normalized = []
    for fs in forecast_sets:
        triples = sorted(
            zip(
                fs.forecaster_ids,
                (tuple(v) for v in fs.forecasts_values),
                fs.timesteps,
            )
        )
        normalized.append((fs.timestep, triples))
    return normalized


def _random_forecasts(rng: random.Random, n_users: int, forecasts_per_user: int):
    open_time = datetime(2020, 1, 1, tzinfo=dt_timezone.utc)
    close_time = datetime(2023, 1, 1, tzinfo=dt_timezone.utc)
    span = (close_time - open_time).total_seconds()

    forecasts = []
    next_id = 1
    for author_id in range(n_users):
        offsets = sorted(rng.uniform(0, span) for _ in range(forecasts_per_user))
        times = [open_time + timedelta(seconds=offset) for offset in offsets]
        for i, start_time in enumerate(times):
            end_time = times[i + 1] if i + 1 < len(times) else None
            # occasionally leave the last forecast's end_time set anyway, to
            # exercise the "ends before window close" branch too
            if end_time is None and rng.random() < 0.3:
                end_time = close_time + timedelta(days=rng.randint(1, 30))
            forecasts.append(
                _fake_forecast(
                    next_id, author_id, start_time, end_time, rng.uniform(0.01, 0.99)
                )
            )
            next_id += 1
    return forecasts, open_time, close_time


def test_equivalence_random_no_window():
    rng = random.Random(1)
    forecasts, _, _ = _random_forecasts(rng, n_users=15, forecasts_per_user=4)

    legacy = _legacy_get_user_forecast_history(forecasts, minimize=False)
    new = get_user_forecast_history(forecasts, minimize=False)

    assert _normalize(legacy) == _normalize(new)


def test_equivalence_random_with_window():
    rng = random.Random(2)
    forecasts, open_time, close_time = _random_forecasts(
        rng, n_users=15, forecasts_per_user=4
    )
    earliest_time = open_time + timedelta(days=200)
    latest_time = close_time - timedelta(days=100)

    legacy = _legacy_get_user_forecast_history(
        forecasts, minimize=False, earliest_time=earliest_time, latest_time=latest_time
    )
    new = get_user_forecast_history(
        forecasts, minimize=False, earliest_time=earliest_time, latest_time=latest_time
    )

    assert _normalize(legacy) == _normalize(new)


def test_equivalence_random_minimized():
    rng = random.Random(3)
    forecasts, _, _ = _random_forecasts(rng, n_users=30, forecasts_per_user=5)

    legacy = _legacy_get_user_forecast_history(forecasts, minimize=True)
    new = get_user_forecast_history(forecasts, minimize=True)

    assert _normalize(legacy) == _normalize(new)


def test_equivalence_many_random_seeds():
    for seed in range(20):
        rng = random.Random(seed)
        n_users = rng.randint(2, 25)
        forecasts_per_user = rng.randint(1, 6)
        forecasts, open_time, close_time = _random_forecasts(
            rng, n_users=n_users, forecasts_per_user=forecasts_per_user
        )

        use_window = rng.random() < 0.5
        earliest_time = (
            open_time + timedelta(days=rng.randint(0, 500)) if use_window else None
        )
        latest_time = (
            close_time - timedelta(days=rng.randint(0, 200)) if use_window else None
        )
        minimize = rng.choice([False, True, 2, 50])

        legacy = _legacy_get_user_forecast_history(
            forecasts,
            minimize=minimize,
            earliest_time=earliest_time,
            latest_time=latest_time,
        )
        new = get_user_forecast_history(
            forecasts,
            minimize=minimize,
            earliest_time=earliest_time,
            latest_time=latest_time,
        )

        assert _normalize(legacy) == _normalize(new), f"mismatch for seed={seed}"


def test_equivalence_overlapping_same_author():
    # Two concurrent forecasts from the same author (not superseding one
    # another) - an edge case the original per-forecast loop handles by
    # simply not deduping by author. The new dict-by-forecast-id sweep must
    # preserve that instead of collapsing them.
    t0 = datetime(2024, 1, 1, tzinfo=dt_timezone.utc)
    t1 = datetime(2024, 2, 1, tzinfo=dt_timezone.utc)
    t2 = datetime(2024, 3, 1, tzinfo=dt_timezone.utc)

    forecasts = [
        _fake_forecast(1, author_id=1, start_time=t0, end_time=t2, probability_yes=0.2),
        _fake_forecast(2, author_id=1, start_time=t1, end_time=None, probability_yes=0.9),
        _fake_forecast(3, author_id=2, start_time=t0, end_time=None, probability_yes=0.5),
    ]

    legacy = _legacy_get_user_forecast_history(forecasts, minimize=False)
    new = get_user_forecast_history(forecasts, minimize=False)

    assert _normalize(legacy) == _normalize(new)
    # sanity: at t1, author 1 should appear twice (both forecasts active)
    at_t1 = next(fs for fs in new if fs.timestep == t1)
    assert at_t1.forecaster_ids.count(1) == 2


def test_equivalence_no_forecasts():
    assert get_user_forecast_history([], minimize=False) == []
    assert get_user_forecast_history([], minimize=True) == []
