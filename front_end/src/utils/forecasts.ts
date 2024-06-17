import { round } from "lodash";

import {
  MultipleChoiceForecast,
  NumericForecast,
  QuestionType,
} from "@/types/question";

export function getForecastPctDisplayValue(value: number | string) {
  return `${Math.round(Number(value) * 100)}%`;
}

export function getForecastNumericDisplayValue(value: number | string) {
  return Number(value).toFixed(1);
}

export function formatPrediction(
  prediction: number,
  questionType: QuestionType
) {
  switch (questionType) {
    case QuestionType.Numeric:
      return getForecastNumericDisplayValue(prediction);
    case QuestionType.Binary:
      return getForecastPctDisplayValue(prediction);
    default:
      return prediction;
  }
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
