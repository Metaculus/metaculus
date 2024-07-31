import * as d3 from "d3";
import {
  format,
  differenceInMilliseconds,
  fromUnixTime,
  getUnixTime,
  subDays,
  subMonths,
} from "date-fns";
import { findLastIndex, uniq } from "lodash";
import { Tuple } from "victory";

import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import {
  FanOption,
  Line,
  NumericChartType,
  Scale,
  TimelineChartZoomOption,
} from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import {
  MultipleChoiceForecast,
  QuestionType,
  QuestionWithNumericForecasts,
  Question,
} from "@/types/question";
import { computeQuartilesFromCDF } from "@/utils/math";
import { abbreviatedNumber } from "@/utils/number_formatters";
import { extractQuestionGroupName } from "@/utils/questions";

export function getNumericChartTypeFromQuestion(
  type: QuestionType
): QuestionType | undefined {
  switch (type) {
    case QuestionType.Numeric:
      return QuestionType.Numeric;
    case QuestionType.Date:
      return QuestionType.Date;
    case QuestionType.Binary:
      return QuestionType.Binary;
    default:
      return undefined;
  }
}

export function generateNumericDomain(
  timestamps: number[],
  zoom: TimelineChartZoomOption
): Tuple<number> {
  const latestTimestamp = Math.max(...timestamps);
  const latestDate = fromUnixTime(latestTimestamp);
  let startDate: Date;
  switch (zoom) {
    case TimelineChartZoomOption.OneDay:
      startDate = subDays(latestDate, 1);
      break;
    case TimelineChartZoomOption.OneWeek:
      startDate = subDays(latestDate, 7);
      break;
    case TimelineChartZoomOption.TwoMonths:
      startDate = subMonths(latestDate, 2);
      break;
    default:
      startDate = fromUnixTime(Math.min(...timestamps));
  }

  return [
    Math.max(Math.min(...timestamps), getUnixTime(startDate)),
    latestTimestamp,
  ];
}

export function generateTimestampXScale(
  xDomain: Tuple<number>,
  width: number
): Scale {
  const oneMinute = 60 * 1000;
  const oneHour = 60 * oneMinute;
  const oneDay = 24 * oneHour;
  const oneMonth = 30 * oneDay;
  const halfYear = 6 * oneMonth;
  const oneYear = 365 * oneDay;

  let ticks;
  let format;
  let cursorFormat;
  const start = fromUnixTime(xDomain[0]);
  const end = fromUnixTime(xDomain[1]);
  const timeRange = differenceInMilliseconds(end, start);
  const maxTicks = Math.floor(width / 80);
  if (timeRange < oneHour) {
    ticks = d3.timeMinute.range(start, end);
    format = d3.timeFormat("%_I:%M %p");
    cursorFormat = d3.timeFormat("%_I:%M %p, %b %d");
  } else if (timeRange < oneDay) {
    const every30Minutes = d3.timeMinute.every(30);
    if (every30Minutes) {
      ticks = every30Minutes.range(start, end);
    } else {
      ticks = d3.timeHour.range(start, end);
    }
    format = d3.timeFormat("%_I:%M %p");
    cursorFormat = d3.timeFormat("%_I:%M %p, %b %d");
  } else if (timeRange < halfYear) {
    ticks = d3.timeDay.range(start, end);
    format = d3.timeFormat("%b %d");
    cursorFormat = d3.timeFormat("%b %d, %Y");
  } else if (timeRange < oneYear) {
    ticks = d3.timeMonth.range(start, end);
    format = d3.timeFormat("%b %d");
    cursorFormat = d3.timeFormat("%b %d, %Y");
  } else {
    ticks = d3.timeMonth.range(start, end);
    format = (date: Date) => {
      const isFirstMonthOfYear = date.getMonth() === 0;
      return isFirstMonthOfYear
        ? d3.timeFormat("%Y")(date)
        : d3.timeFormat("%b %e")(date);
    };
    cursorFormat = d3.timeFormat("%b %d, %Y");
  }

  return {
    ticks: ticks.map((tick) => getUnixTime(tick)),
    tickFormat: (x: number, index?: number) => {
      if (!index) {
        return format(fromUnixTime(x));
      }

      if (index % Math.max(1, Math.floor(ticks.length / maxTicks)) !== 0) {
        return "";
      }

      return format(fromUnixTime(x));
    },
    cursorFormat: (x: number) => cursorFormat(fromUnixTime(x)),
  };
}

/**
 * scales an internal loction within a range of 0 to 1 to a location
 * within a range of rangeMin to rangeMax, taking into account any logarithmic
 * scaling determined by zeroPoint
 */
export function scaleInternalLocation(
  x: number,
  rangeMin: number,
  rangeMax: number,
  zeroPoint: number | null
) {
  let scaled_location = null;
  if (zeroPoint !== null) {
    const deriv_ratio = (rangeMax - zeroPoint) / (rangeMin - zeroPoint);
    scaled_location =
      rangeMin +
      ((rangeMax - rangeMin) * (deriv_ratio ** x - 1)) / (deriv_ratio - 1);
  } else {
    scaled_location = rangeMin + (rangeMax - rangeMin) * x;
  }
  return scaled_location;
}

/**
 * Returns the display value of an internal location given the
 * details of the question
 *
 * Accepts a Question or the individual parameters of a Question
 */
export function getDisplayValue(
  value: number | undefined,
  question: Question
): string;
export function getDisplayValue(
  value: number | undefined,
  questionType: QuestionType,
  rangeMin?: number | null,
  rangeMax?: number | null,
  zeroPoint?: number | null
): string;
export function getDisplayValue(
  value: number | undefined,
  questionOrQuestionType: Question | QuestionType,
  rangeMin?: number | null,
  rangeMax?: number | null,
  zeroPoint?: number | null
): string {
  let qType: string;
  let rMin: number | null;
  let rMax: number | null;
  let zPoint: number | null;

  if (typeof questionOrQuestionType === "object") {
    // Handle the case where the input is a Question object
    qType = questionOrQuestionType.type;
    rMin = questionOrQuestionType.range_min;
    rMax = questionOrQuestionType.range_max;
    zPoint = questionOrQuestionType.zero_point;
  } else {
    // Handle the case where the input is individual parameters
    qType = questionOrQuestionType;
    rMin = rangeMin ?? 0;
    rMax = rangeMax ?? 1;
    zPoint = zeroPoint ?? null;
  }

  if (value === undefined) {
    return "...";
  }
  const scaledValue = scaleInternalLocation(
    value,
    rMin ?? 0,
    rMax ?? 1,
    zPoint
  );
  if (qType === QuestionType.Date) {
    return format(fromUnixTime(scaledValue), "yyyy-MM");
  } else if (qType === QuestionType.Numeric) {
    return abbreviatedNumber(scaledValue);
  } else {
    return `${Math.round(scaledValue * 100)}%`;
  }
}

export function generatePercentageYScale(containerHeight: number): Scale {
  const desiredMajorTicks = [0, 20, 40, 60, 80, 100].map((tick) => tick / 100);
  const minorTicksPerMajor = 9;
  const desiredMajorTickDistance = 20;

  const maxMajorTicks = Math.floor(containerHeight / desiredMajorTickDistance);

  let majorTicks = desiredMajorTicks;
  if (maxMajorTicks < desiredMajorTicks.length) {
    // adjust major ticks on small height
    const step = 1 / (maxMajorTicks - 1);
    majorTicks = Array.from({ length: maxMajorTicks }, (_, i) => i * step);
  }

  const ticks = [];
  for (let i = 0; i < majorTicks.length - 1; i++) {
    ticks.push(majorTicks[i]);
    const step = (majorTicks[i + 1] - majorTicks[i]) / (minorTicksPerMajor + 1);
    for (let j = 1; j <= minorTicksPerMajor; j++) {
      ticks.push(majorTicks[i] + step * j);
    }
  }
  ticks.push(majorTicks[majorTicks.length - 1]);

  return {
    ticks,
    tickFormat: (y: number) =>
      majorTicks.includes(y) ? `${Math.round(y * 100)}%` : "",
  };
}

export function generateChoiceItemsFromMultipleChoiceForecast(
  dataset: MultipleChoiceForecast,
  config?: {
    activeCount?: number;
  }
): ChoiceItem[] {
  const { activeCount } = config ?? {};

  const {
    timestamps,
    nr_forecasters,
    my_forecasts,
    latest_pmf,
    latest_cdf,
    ...choices
  } = dataset;
  return Object.entries(choices).map(([choice, values], index) => ({
    choice,
    values: values.map((x: { median: number }) => x.median),
    color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
    active: !!activeCount ? index <= activeCount - 1 : true,
    highlighted: false,
  }));
}

export function generateChoiceItemsFromBinaryGroup(
  questions: QuestionWithNumericForecasts[],
  config?: {
    withMinMax?: boolean;
    activeCount?: number;
    preselectedQuestionId?: number;
    sortPredictionDesc?: boolean;
  }
): ChoiceItem[] {
  const { withMinMax, activeCount, preselectedQuestionId, sortPredictionDesc } =
    config ?? {};

  const sortedQuestions = sortPredictionDesc
    ? [...questions].sort((a, b) => {
        const aMean = a.forecasts.medians.at(-1) ?? 0;
        const bMean = b.forecasts.medians.at(-1) ?? 0;
        return bMean - aMean;
      })
    : questions;

  return sortedQuestions.map((q, index) => {
    let active = true;
    if (preselectedQuestionId !== undefined) {
      active = q.id === preselectedQuestionId;
    } else if (activeCount) {
      active = index <= activeCount - 1;
    }

    return {
      choice: extractQuestionGroupName(q.title),
      values: q.forecasts.medians,
      ...(withMinMax
        ? {
            minValues: q.forecasts.q1s,
            maxValues: q.forecasts.q3s,
          }
        : {}),
      timestamps: q.forecasts.timestamps,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      active,
      highlighted: q.id === preselectedQuestionId,
    };
  });
}

export function getFanOptionsFromNumericGroup(
  questions: QuestionWithNumericForecasts[]
): FanOption[] {
  return questions
    .map((q) => ({
      name: extractQuestionGroupName(q.title),
      cdf: q.forecasts.latest_cdf,
      resolvedAt: new Date(q.scheduled_resolve_time),
      resolved: q.resolution !== null,
    }))
    .sort((a, b) => differenceInMilliseconds(a.resolvedAt, b.resolvedAt))
    .map(({ name, cdf, resolved }) => ({
      name,
      quartiles: computeQuartilesFromCDF(cdf),
      resolved,
    }));
}

export function getGroupQuestionsTimestamps(
  questions: QuestionWithNumericForecasts[]
): number[] {
  return uniq(
    questions.reduce<number[]>(
      (acc, question) => [...acc, ...question.forecasts.timestamps],
      []
    )
  ).sort((a, b) => a - b);
}

export function findClosestTimestamp(
  timestamps: number[],
  timestamp: number
): number {
  return timestamps.reduce(
    (prev, curr) =>
      Math.abs(curr - timestamp) < Math.abs(prev - timestamp) ? curr : prev,
    0
  );
}

export const getChartZoomOptions = () =>
  Object.values(TimelineChartZoomOption).map((zoomOption) => ({
    label: zoomOption,
    value: zoomOption,
  }));

export const interpolateYValue = (xValue: number, line: Line) => {
  const i = findLastIndex(line, (point) => point.x <= xValue);
  const p1 = line[i];
  const p2 = line[i + 1];

  if (!p1 || !p2) return 0;

  const t = (xValue - p1.x) / (p2.x - p1.x);
  return p1.y + t * (p2.y - p1.y);
};
