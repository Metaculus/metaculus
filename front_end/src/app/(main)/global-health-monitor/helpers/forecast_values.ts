import { isNil } from "lodash";

import { PostWithForecasts } from "@/types/post";
import {
  AggregateForecast,
  AggregateForecastHistory,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";
import { getDiscreteValueOptions } from "@/utils/formatters/prediction";
import { getCdfAt, scaleInternalLocation } from "@/utils/math";

import { ValueRef, ValueTone } from "../config/questions";

export type ValueBound = "above" | "below" | null;

export type ForecastPoint = {
  value: number;
  lower: number | null;
  upper: number | null;
  bound: ValueBound;
  // Resolved option name for multiple choice refs ("top" resolves to the leading option).
  option: string | null;
  startTime: number;
  endTime: number | null;
};

export type ChangeDirection = "up" | "down" | "steady";

export type ForecastChange = {
  delta: number;
  unit: "pp" | "percent" | "days" | "absolute";
  direction: ChangeDirection;
};

export type ChangeSentiment = "worse" | "better" | "neutral";

const SECONDS_PER_DAY = 86_400;

export function findQuestion(
  post: PostWithForecasts | undefined,
  ref: Pick<ValueRef, "subQuestionId">
): QuestionWithForecasts | null {
  if (!post) {
    return null;
  }
  if (ref.subQuestionId) {
    return (
      (post.group_of_questions?.questions.find(
        (question) => question.id === ref.subQuestionId
      ) as QuestionWithForecasts | undefined) ?? null
    );
  }
  return (post.question as QuestionWithForecasts | undefined) ?? null;
}

export function getDefaultAggregation(
  question: QuestionWithForecasts
): AggregateForecastHistory | null {
  return question.aggregations?.[question.default_aggregation_method] ?? null;
}

// Last aggregate that started at or before `timestamp` (seconds), even when it has since lapsed.
export function findAggregateAt(
  history: AggregateForecast[],
  timestamp: number
): AggregateForecast | null {
  let found: AggregateForecast | null = null;
  for (const aggregate of history) {
    if (aggregate.start_time > timestamp) {
      break;
    }
    found = aggregate;
  }
  return found;
}

export function isLapsedAt(aggregate: AggregateForecast, timestamp: number) {
  return !isNil(aggregate.end_time) && aggregate.end_time <= timestamp;
}

function scaleLocation(
  question: QuestionWithForecasts,
  location: number
): { value: number; bound: ValueBound } {
  let bound: ValueBound = null;
  if (location >= 1 && question.open_upper_bound) {
    bound = "above";
  } else if (location <= 0 && question.open_lower_bound) {
    bound = "below";
  }
  const clamped = Math.min(Math.max(location, 0), 1);
  const scaled = scaleInternalLocation(clamped, question.scaling);
  const discreteOptions = getDiscreteValueOptions(question);
  if (!discreteOptions?.length) {
    return { value: scaled, bound };
  }
  const nearest = discreteOptions.reduce((best, option) =>
    Math.abs(option - scaled) < Math.abs(best - scaled) ? option : best
  );
  return { value: nearest, bound };
}

function scaleOptional(
  question: QuestionWithForecasts,
  location: number | null | undefined
): number | null {
  return isNil(location) ? null : scaleLocation(question, location).value;
}

function getOptionIndex(
  question: QuestionWithForecasts,
  aggregate: AggregateForecast,
  option: string
): number {
  const options = question.options ?? [];
  if (option !== "top") {
    return options.indexOf(option);
  }
  const centers = aggregate.centers ?? [];
  let bestIndex = -1;
  let bestValue = -Infinity;
  centers.forEach((center, index) => {
    if (!isNil(center) && center > bestValue) {
      bestValue = center;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function tailProbability(
  question: QuestionWithForecasts,
  aggregate: AggregateForecast,
  ref: ValueRef
): number | null {
  const cdf = aggregate.forecast_values as number[] | null | undefined;
  if (!cdf?.length || isNil(ref.param)) {
    return null;
  }
  const below = getCdfAt(ref.param, cdf, question.scaling);
  if (isNil(below)) {
    return null;
  }
  return ref.mode === "pAbove" ? 1 - below : below;
}

/**
 * Reads a ref's value from one aggregate. `optionOverride` pins a multiple choice
 * option, so "top" refs compare the same option across editions.
 */
export function readForecastPoint(
  question: QuestionWithForecasts,
  aggregate: AggregateForecast,
  ref: ValueRef,
  optionOverride?: string | null
): ForecastPoint | null {
  const base = {
    startTime: aggregate.start_time,
    endTime: aggregate.end_time ?? null,
  };

  if (ref.mode === "pAbove" || ref.mode === "pBelow") {
    const probability = tailProbability(question, aggregate, ref);
    return isNil(probability)
      ? null
      : {
          ...base,
          value: probability,
          lower: null,
          upper: null,
          bound: null,
          option: null,
        };
  }

  if (question.type === QuestionType.MultipleChoice) {
    const option = optionOverride ?? ref.option ?? "top";
    const index = getOptionIndex(question, aggregate, option);
    const value = index >= 0 ? aggregate.centers?.[index] : null;
    if (isNil(value)) {
      return null;
    }
    return {
      ...base,
      value,
      lower: aggregate.interval_lower_bounds?.[index] ?? null,
      upper: aggregate.interval_upper_bounds?.[index] ?? null,
      bound: null,
      option: question.options?.[index] ?? null,
    };
  }

  const center = aggregate.centers?.[0];
  if (isNil(center)) {
    return null;
  }

  if (question.type === QuestionType.Binary) {
    return {
      ...base,
      value: center,
      lower: aggregate.interval_lower_bounds?.[0] ?? null,
      upper: aggregate.interval_upper_bounds?.[0] ?? null,
      bound: null,
      option: null,
    };
  }

  const { value, bound } = scaleLocation(question, center);
  return {
    ...base,
    value,
    lower: scaleOptional(question, aggregate.interval_lower_bounds?.[0]),
    upper: scaleOptional(question, aggregate.interval_upper_bounds?.[0]),
    bound,
    option: null,
  };
}

export function readForecastAt(
  question: QuestionWithForecasts,
  ref: ValueRef,
  timestamp: number,
  optionOverride?: string | null
): { point: ForecastPoint; lapsed: boolean } | null {
  const aggregation = getDefaultAggregation(question);
  if (!aggregation) {
    return null;
  }
  const aggregate = findAggregateAt(aggregation.history ?? [], timestamp);
  if (!aggregate) {
    return null;
  }
  const point = readForecastPoint(question, aggregate, ref, optionOverride);
  return point ? { point, lapsed: isLapsedAt(aggregate, timestamp) } : null;
}

export function readLatestForecast(
  question: QuestionWithForecasts,
  ref: ValueRef,
  optionOverride?: string | null
): ForecastPoint | null {
  const aggregation = getDefaultAggregation(question);
  const latest = aggregation?.latest;
  if (!latest) {
    return null;
  }
  return readForecastPoint(question, latest, ref, optionOverride);
}

export function getChangeKind(
  ref: ValueRef
): "probability" | "percent" | "date" | "relative" {
  if (ref.mode === "pAbove" || ref.mode === "pBelow") {
    return "probability";
  }
  switch (ref.format.kind) {
    case "probability":
      return "probability";
    case "percent":
      return "percent";
    case "date":
      return "date";
    default:
      return "relative";
  }
}

export function computeChange(
  ref: ValueRef,
  current: number | null | undefined,
  previous: number | null | undefined
): ForecastChange | null {
  if (isNil(current) || isNil(previous)) {
    return null;
  }

  let delta: number;
  let unit: ForecastChange["unit"];
  let threshold: number;

  switch (getChangeKind(ref)) {
    case "probability":
      delta = (current - previous) * 100;
      unit = "pp";
      threshold = ref.steady ?? 1;
      break;
    case "percent":
      delta = current - previous;
      unit = "pp";
      threshold = ref.steady ?? 1;
      break;
    case "date":
      delta = (current - previous) / SECONDS_PER_DAY;
      unit = "days";
      threshold = ref.steady ?? 3;
      break;
    default:
      if (previous === 0) {
        delta = current;
        unit = "absolute";
        threshold = ref.steady ?? 0.5;
      } else {
        delta = ((current - previous) / Math.abs(previous)) * 100;
        unit = "percent";
        threshold = ref.steady ?? 5;
      }
  }

  // Rounding keeps float noise (0.05 - 0.06 = -0.00999...) from flipping a change at the threshold.
  const rounded = Math.round(delta * 1e6) / 1e6;
  const direction: ChangeDirection =
    Math.abs(rounded) < threshold ? "steady" : rounded > 0 ? "up" : "down";
  return { delta: rounded, unit, direction };
}

export function getChangeSentiment(
  tone: ValueTone | undefined,
  direction: ChangeDirection
): ChangeSentiment {
  if (direction === "steady" || !tone || tone === "neutral") {
    return "neutral";
  }
  const higherIsWorse = tone === "higherIsWorse";
  if (direction === "up") {
    return higherIsWorse ? "worse" : "better";
  }
  return higherIsWorse ? "better" : "worse";
}

export function readHistorySeries(
  question: QuestionWithForecasts,
  ref: ValueRef,
  option: string | null
): { x: number; y: number }[] {
  const aggregation = getDefaultAggregation(question);
  if (!aggregation || ref.mode === "pAbove" || ref.mode === "pBelow") {
    return [];
  }
  const series: { x: number; y: number }[] = [];
  for (const aggregate of aggregation.history ?? []) {
    const point = readForecastPoint(question, aggregate, ref, option);
    if (point) {
      series.push({ x: aggregate.start_time, y: point.value });
    }
  }
  return series;
}
