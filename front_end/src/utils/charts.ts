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
  Scale,
  TimelineChartZoomOption,
} from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import {
  QuestionType,
  QuestionWithNumericForecasts,
  Question,
  QuestionWithMultipleChoiceForecasts,
  UserForecastHistory,
  Scaling,
  AggregateForecast,
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
  const latestTimestamp = timestamps.at(-1);
  if (latestTimestamp === undefined) {
    return [0, 0];
  }
  const latestDate = fromUnixTime(latestTimestamp!);
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
  const maxTicks = Math.floor(width / 60);
  if (timeRange < oneHour) {
    ticks = d3.timeMinute.range(start, end);
    format = d3.timeFormat("%_I:%M %p");
    cursorFormat = d3.timeFormat("%_I:%M %p, %b %d");
  } else if (timeRange < oneHour * 6) {
    const every5Minutes = d3.timeMinute.every(5);
    if (every5Minutes) {
      ticks = every5Minutes.range(start, end);
    } else {
      ticks = d3.timeHour.range(start, end);
    }
    format = d3.timeFormat("%_I:%M %p");
    cursorFormat = d3.timeFormat("%_I:%M %p, %b %d");
  } else if (timeRange <= oneDay * 2) {
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
  } else if (timeRange < oneYear * 2) {
    ticks = d3.timeMonth.range(start, end);
    format = (date: Date) => {
      const isFirstMonthOfYear = date.getMonth() === 0;
      return isFirstMonthOfYear
        ? d3.timeFormat("%Y")(date)
        : d3.timeFormat("%b %d")(date);
    };
    cursorFormat = d3.timeFormat("%b %d, %Y");
  } else if (timeRange < oneYear * 4) {
    const adjustedStart = d3.timeYear.floor(start);
    ticks = d3.timeMonth.range(adjustedStart, end, 3);
    format = (date: Date) => {
      const isFirstMonthOfYear = date.getMonth() === 0;
      return isFirstMonthOfYear
        ? d3.timeFormat("%Y")(date)
        : d3.timeFormat("%b %e")(date);
    };
    cursorFormat = d3.timeFormat("%b %d, %Y");
  } else {
    const adjustedStart = d3.timeYear.floor(start);
    ticks = d3.timeMonth.range(adjustedStart, end, 6);
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
 * within a range of range_min to range_max, taking into account any logarithmic
 * scaling determined by zero_point
 */
export function scaleInternalLocation(x: number, scaling: Scaling) {
  let scaled_location = null;
  const { range_min, range_max, zero_point } = scaling;
  if (zero_point !== null) {
    const derivRatio = (range_max! - zero_point) / (range_min! - zero_point);
    scaled_location =
      range_min! +
      ((range_max! - range_min!) * (derivRatio ** x - 1)) / (derivRatio - 1);
  } else {
    scaled_location = range_min! + (range_max! - range_min!) * x;
  }
  return scaled_location;
}

/**
 * unscales a nominal location within a range of range_min to range_max
 * to an internal location within a range of 0 to 1
 * taking into account any logarithmic scaling determined by zero_point
 */
export function unscaleNominalLocation(x: number, scaling: Scaling) {
  let unscaled_location = null;
  const { range_min, range_max, zero_point } = scaling;
  if (zero_point !== null) {
    const derivRatio = (range_max! - zero_point) / (range_min! - zero_point);
    unscaled_location =
      Math.log(
        ((x - range_min!) * (derivRatio - 1)) / (range_max! - range_min!) + 1
      ) / Math.log(derivRatio);
  } else {
    unscaled_location = (x - range_min!) / (range_max! - range_min!);
  }
  return unscaled_location;
}

export function displayValue(
  value: number,
  questionType: QuestionType
): string {
  if (questionType === QuestionType.Date) {
    return format(fromUnixTime(value), "yyyy-MM");
  } else if (questionType === QuestionType.Numeric) {
    return abbreviatedNumber(value);
  } else {
    return `${Math.round(value * 100)}%`;
  }
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
  scaling: Scaling
): string;
export function getDisplayValue(
  value: number | undefined,
  questionOrQuestionType: Question | QuestionType,
  scaling?: Scaling
): string {
  let qType: string;
  let rMin: number | null;
  let rMax: number | null;
  let zPoint: number | null;

  if (typeof questionOrQuestionType === "object") {
    // Handle the case where the input is a Question object
    qType = questionOrQuestionType.type;
    rMin = questionOrQuestionType.scaling.range_min;
    rMax = questionOrQuestionType.scaling.range_max;
    zPoint = questionOrQuestionType.scaling.zero_point;
  } else {
    // Handle the case where the input is individual parameters
    qType = questionOrQuestionType;
    rMin = scaling!.range_min ?? 0;
    rMax = scaling!.range_max ?? 1;
    zPoint = scaling!.zero_point ?? null;
  }

  if (value === undefined) {
    return "...";
  }
  const scaledValue = scaleInternalLocation(value, {
    range_min: rMin ?? 0,
    range_max: rMax ?? 1,
    zero_point: zPoint,
  });
  return displayValue(scaledValue, qType as QuestionType);
}

export function getDisplayUserValue(
  myForecasts: UserForecastHistory,
  value: number | undefined,
  valueTimestamp: number,
  questionOrQuestionType: Question | QuestionType,
  scaling?: Scaling
): string {
  let qType: string;
  let rMin: number | null;
  let rMax: number | null;
  let zPoint: number | null;
  let closestUserForecastIndex = -1;
  myForecasts?.history.forEach((forecast, index) => {
    if (forecast.start_time <= valueTimestamp) {
      closestUserForecastIndex = index;
    }
  });
  if (closestUserForecastIndex === -1) {
    return "?";
  }
  const closestUserForecast = myForecasts.history[closestUserForecastIndex];

  if (typeof questionOrQuestionType === "object") {
    // Handle the case where the input is a Question object
    qType = questionOrQuestionType.type;
    rMin = questionOrQuestionType.scaling.range_min;
    rMax = questionOrQuestionType.scaling.range_max;
    zPoint = questionOrQuestionType.scaling.zero_point;
  } else {
    // Handle the case where the input is individual parameters
    qType = questionOrQuestionType;
    rMin = scaling!.range_min ?? 0;
    rMax = scaling!.range_max ?? 1;
    zPoint = scaling!.zero_point ?? null;
  }

  let center: number;
  if (qType === QuestionType.Binary) {
    center = closestUserForecast.forecast_values[1];
  } else {
    center = closestUserForecast.centers![0];
  }
  if (value === undefined) {
    return "...";
  }
  const scaledValue = scaleInternalLocation(center, {
    range_min: rMin ?? 0,
    range_max: rMax ?? 1,
    zero_point: zPoint,
  });
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
  question: QuestionWithMultipleChoiceForecasts,
  config?: {
    activeCount?: number;
  }
): ChoiceItem[] {
  const { activeCount } = config ?? {};

  const latest = question.aggregations.recency_weighted.latest;

  const choiceOrdering: number[] = question.options!.map((_, i) => i);
  choiceOrdering.sort((a, b) => {
    const aCenter = latest?.forecast_values[a] ?? 0;
    const bCenter = latest?.forecast_values[b] ?? 0;
    return bCenter - aCenter;
  });

  const history = question.aggregations.recency_weighted.history;
  return choiceOrdering.map((order, index) => {
    const label = question.options![order];
    return {
      choice: label,
      values: history.map((forecast) => forecast.centers![order]),
      minValues: history.map(
        (forecast) => forecast.interval_lower_bounds![order]
      ),
      maxValues: history.map(
        (forecast) => forecast.interval_upper_bounds![order]
      ),
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      active: !!activeCount ? index <= activeCount - 1 : true,
      highlighted: false,
      resolution: question.resolution,
      displayedResolution: question.resolution
        ? label === question.resolution
          ? "Yes"
          : "No"
        : undefined,
      rangeMin: 0,
      rangeMax: 1,
    };
  });
}

export function generateChoiceItemsFromBinaryGroup(
  questions: QuestionWithNumericForecasts[],
  config?: {
    withMinMax?: boolean;
    activeCount?: number;
    preselectedQuestionId?: number;
  }
): ChoiceItem[] {
  const { activeCount } = config ?? {};

  const latests: (AggregateForecast | undefined)[] = questions.map(
    (question) => question.aggregations.recency_weighted.latest
  );
  if (latests.length == 0) {
    return [];
  }
  const choiceOrdering: number[] = latests.map((_, i) => i);
  choiceOrdering.sort((a, b) => {
    const aCenter = latests[a]?.centers![0] ?? 0;
    const bCenter = latests[b]?.centers![0] ?? 0;
    return bCenter - aCenter;
  });

  return choiceOrdering.map((order, index) => {
    const question = questions[order];
    const history = question.aggregations.recency_weighted.history;
    const label = extractQuestionGroupName(question.title);
    return {
      choice: label,
      values: history.map((forecast) => forecast.centers![0]),
      minValues: history.map(
        (forecast) =>
          forecast.interval_lower_bounds![order] ??
          forecast.interval_lower_bounds![0]
      ),
      maxValues: history.map(
        (forecast) =>
          forecast.interval_upper_bounds![order] ??
          forecast.interval_upper_bounds![0]
      ),
      timestamps: history.map((forecast) => forecast.start_time),
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      active: !!activeCount ? index <= activeCount - 1 : true,
      highlighted: false,
      resolution: question.resolution,
      rangeMin: question.scaling.range_min ?? 0,
      rangeMax: question.scaling.range_min ?? 1,
      scaling: question.scaling,
    };
  });
}

export function getFanOptionsFromNumericGroup(
  questions: QuestionWithNumericForecasts[]
): FanOption[] {
  return questions
    .map((q) => ({
      name: extractQuestionGroupName(q.title),
      cdf: q.aggregations.recency_weighted.latest?.forecast_values ?? [],
      resolvedAt: new Date(q.scheduled_resolve_time),
      resolved: q.resolution !== null,
      question: q,
    }))
    .sort((a, b) => differenceInMilliseconds(a.resolvedAt, b.resolvedAt))
    .map(({ name, cdf, resolved, question }) => ({
      name,
      quartiles: computeQuartilesFromCDF(cdf),
      resolved,
      question,
    }));
}

export function getGroupQuestionsTimestamps(
  questions: QuestionWithNumericForecasts[]
): number[] {
  return uniq(
    questions.reduce<number[]>(
      (acc, question) => [
        ...acc,
        ...question.aggregations.recency_weighted.history.map(
          (x) => x.start_time
        ),
      ],
      []
    )
  ).sort((a, b) => a - b);
}

export function findPreviousTimestamp(
  timestamps: number[],
  timestamp: number
): number {
  return timestamps.reduce(
    (prev, curr) => (curr < timestamp && curr > prev ? curr : prev),
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

export function generateTicksY(
  height: number,
  desiredMajorTicks: number[],
  majorTickDistance?: number
) {
  const minorTicksPerMajor = 9;
  const desiredMajorTickDistance = majorTickDistance ?? 50;
  let majorTicks = desiredMajorTicks;
  const maxMajorTicks = Math.floor(height / desiredMajorTickDistance);

  if (maxMajorTicks < desiredMajorTicks.length) {
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
  const tickFormat = (value: number): string => {
    if (!majorTicks.includes(value)) {
      return "";
    }
    return value.toString();
  };
  return { ticks, tickFormat, majorTicks };
}
