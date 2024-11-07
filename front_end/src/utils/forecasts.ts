import { format, fromUnixTime } from "date-fns";
import { isNil, round } from "lodash";
import * as math from "mathjs";

import { MultiSliderValue } from "@/components/sliders/multi_slider";
import {
  MultipleChoiceForecast,
  NumericForecast,
  QuestionType,
} from "@/types/question";
import { cdfFromSliders, cdfToPmf } from "@/utils/math";
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

export function extractPrevBinaryForecastValue(
  prevForecast: any
): number | null {
  return typeof prevForecast === "number" ? round(prevForecast * 100, 1) : null;
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
  const componentCdfs = forecast.map(
    (component, index) =>
      math.multiply(
        cdfFromSliders(
          component.left,
          component.center,
          component.right,
          lowerOpen,
          upperOpen
        ),
        normalizedWeights[index]
      ) as number[]
  );
  let cdf = componentCdfs.reduce((acc, componentCdf) =>
    math.add(acc, componentCdf)
  );
  cdf = cdf.map((F) => Number(F));

  // standardize cdf
  const cdfOffset =
    lowerOpen && upperOpen
      ? (F: number, x: number) => 0.988 * F + 0.01 * x + 0.001
      : lowerOpen
        ? (F: number, x: number) => 0.989 * F + 0.01 * x + 0.001
        : upperOpen
          ? (F: number, x: number) => 0.989 * F + 0.01 * x
          : (F: number, x: number) => 0.99 * F + 0.01 * x;
  cdf = cdf.map(
    (F, index) =>
      Math.round(cdfOffset(F, index / (cdf.length - 1)) * 1e10) / 1e10
  );

  return {
    cdf: cdf,
    pmf: cdfToPmf(cdf),
  };
}
