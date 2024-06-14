import { round } from "lodash";

import { MultipleChoiceForecast, NumericForecast } from "@/types/question";

export function getForecastPctDisplayValue(value: number | string) {
  return `${Math.round(Number(value) * 100)}%`;
}

export function getForecastNumericDisplayValue(value: number | string) {
  return Number(value).toFixed(1);
}

export function getIsForecastEmpty(
  forecast: MultipleChoiceForecast | NumericForecast | null | undefined
): forecast is null {
  return !forecast || !forecast.timestamps || forecast.timestamps.length === 0;
}

export function extractPrevBinaryForecastValue(
  prevForecast: any
): number | null {
  return typeof prevForecast === "number" ? round(prevForecast * 100, 1) : null;
}
