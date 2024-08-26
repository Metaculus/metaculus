import { format, fromUnixTime } from "date-fns";
import { isNil, round } from "lodash";
import * as math from "mathjs";

import { MultiSliderValue } from "@/components/sliders/multi_slider";
import {
  MultipleChoiceForecast,
  NumericForecast,
  QuestionType,
} from "@/types/question";
import { binWeightsFromSliders } from "@/utils/math";
import { abbreviatedNumber } from "@/utils/number_formatters";

export function getForecastPctDisplayValue(
  value: number | string | null | undefined
) {
  if (isNil(value)) {
    return "?";
  }
  return `${Math.round(Number(value) * 100 * 100) / 100}%`;
}

export function getForecastNumericDisplayValue(value: number | string) {
  return abbreviatedNumber(value);
}

export function getForecastDateDisplayValue(value: number) {
  return format(fromUnixTime(value), "MMM d, yyyy");
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
    case QuestionType.Date:
      return getForecastDateDisplayValue(prediction);
    default:
      return prediction.toString();
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

export function extractPrevMultipleChoicesForecastValue(
  prevForecast: any
): Record<string, number> | null {
  if (typeof prevForecast !== "object" || isNil(prevForecast)) {
    return null;
  }

  const result: Record<string, number> = {};
  for (const key in prevForecast) {
    if (typeof prevForecast[key] !== "number") {
      continue;
    }
    result[key] = prevForecast[key];
  }

  return Object.keys(result).length === 0 ? null : result;
}

export function extractPrevNumericForecastValue(prevForecast: any): {
  forecast?: MultiSliderValue[];
  weights?: number[];
} {
  if (typeof prevForecast !== "object" || prevForecast === null) {
    return {};
  }

  const result: { forecast?: MultiSliderValue[]; weights?: number[] } = {};
  if ("forecast" in prevForecast) {
    result.forecast = prevForecast.forecast;
  }

  if ("weights" in prevForecast) {
    result.weights = prevForecast.weights;
  }

  return result;
}

export function getNumericForecastDataset(
  forecast: MultiSliderValue[],
  weights: number[],
  lowerOpen: boolean,
  upperOpen: boolean
) {
  const normalizedWeights = weights.map(
    (x) => x / weights.reduce((a, b) => a + b)
  );
  const result: { cdf: number[]; pmf: number[] } = forecast
    .map((x) =>
      binWeightsFromSliders(x.left, x.center, x.right, lowerOpen, upperOpen)
    )
    .map((x, index) => {
      return {
        pmf: math.multiply(x.pmf, normalizedWeights[index]) as number[],
        cdf: math.multiply(x.cdf, normalizedWeights[index]) as number[],
      };
    })
    .reduce((acc, curr) => {
      return {
        pmf: math.add(acc.pmf, curr.pmf),
        cdf: math.add(acc.cdf, curr.cdf),
      };
    });

  result.pmf = result.pmf.map((x) => Number(x));
  result.cdf = result.cdf.map((x) => Number(x));

  const cdfOffset =
    lowerOpen && upperOpen
      ? (F: number, x: number) => 0.988 * F + 0.01 * x + 0.001
      : lowerOpen
        ? (F: number, x: number) => 0.989 * F + 0.01 * x + 0.001
        : upperOpen
          ? (F: number, x: number) => 0.989 * F + 0.01 * x
          : (F: number, x: number) => 0.99 * F + 0.01 * x;

  const pdfOffset =
    lowerOpen && upperOpen
      ? (f: number) => 0.988 * f + 0.0001
      : lowerOpen
        ? (f: number) => 0.989 * f + 0.0001
        : upperOpen
          ? (f: number) => 0.989 * f + 0.0001
          : (f: number) => 0.99 * f + 0.0001;

  result.cdf = result.cdf.map((F, index) => {
    const x = index / (result.cdf.length - 1);
    return cdfOffset(F, x);
  });
  result.pmf = result.pmf.map((f) => pdfOffset(f));

  return result;
}
