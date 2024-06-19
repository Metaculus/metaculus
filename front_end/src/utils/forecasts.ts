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

export function getForecastPctDisplayValue(
  value: number | string | null | undefined
) {
  if (isNil(value)) {
    return "?";
  }
  return `${Math.round(Number(value) * 100)}%`;
}

export function getForecastNumericDisplayValue(value: number | string) {
  return Number(value).toFixed(1);
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

export function extractPrevNumericForecastValue(prevForecast: any): {
  forecast?: MultiSliderValue[];
  weights?: number[];
} {
  if (typeof prevForecast !== "object") {
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

export function normalizeWeights(weights: number[]) {
  return weights.map((x) => x / weights.reduce((a, b) => a + b));
}

export function getNumericForecastDataset(
  forecast: MultiSliderValue[],
  weights: number[]
) {
  const result: { cdf: number[]; pmf: number[] } = forecast
    .map((x) => binWeightsFromSliders(x.left, x.center, x.right))
    .map((x, index) => {
      return {
        pmf: math.multiply(x.pmf, weights[index]) as number[],
        cdf: math.multiply(x.cdf, weights[index]) as number[],
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

  return result;
}
