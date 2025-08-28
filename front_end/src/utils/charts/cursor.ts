import { isNil } from "lodash";

import { AggregateForecast, AggregateForecastHistory } from "@/types/question";
import { isForecastActive } from "@/utils/forecasts/helpers";

export function findPreviousTimestamp(
  timestamps: number[],
  timestamp: number | null | undefined
): number {
  if (isNil(timestamp)) {
    return 0;
  }

  return timestamps.reduce(
    (prev, curr) => (curr <= timestamp && curr > prev ? curr : prev),
    0
  );
}

export function getCursorForecast(
  cursorTimestamp: number | null | undefined,
  aggregation: AggregateForecastHistory
): AggregateForecast | null {
  let forecastIndex: number = -1;
  if (!isNil(cursorTimestamp)) {
    forecastIndex = aggregation.history.findIndex(
      (f) =>
        cursorTimestamp !== null &&
        f.start_time <= cursorTimestamp &&
        (f.end_time === null || f.end_time > cursorTimestamp)
    );
  } else if (
    cursorTimestamp === null &&
    aggregation.latest &&
    isForecastActive(aggregation.latest)
  ) {
    forecastIndex = aggregation.history.length - 1;
  }
  return forecastIndex === -1
    ? null
    : aggregation.history[forecastIndex] ?? null;
}
