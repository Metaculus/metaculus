import * as d3 from "d3";
import {
  format,
  differenceInMilliseconds,
  fromUnixTime,
  getUnixTime,
  subDays,
  subMonths,
} from "date-fns";
import { range } from "lodash";
import { findLastIndex, isNil, uniq } from "lodash";
import { Tuple, VictoryThemeDefinition } from "victory";

import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import {
  FanOption,
  Line,
  Scale,
  TimelineChartZoomOption,
} from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { Resolution } from "@/types/post";
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
import {
  extractQuestionGroupName,
  formatResolution,
  isUnsuccessfullyResolved,
} from "@/utils/questions";

import {
  getForecastDateDisplayValue,
  getForecastNumericDisplayValue,
  getForecastPctDisplayValue,
} from "./forecasts";

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
  width: number,
  fontSize = 9
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
  const maxTicks = Math.floor(width / (fontSize * 10));
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
    format = d3.timeFormat("%b %Y");
    cursorFormat = d3.timeFormat("%b %d, %Y");
  } else if (timeRange < oneYear) {
    ticks = d3.timeMonth.range(start, end);
    format = d3.timeFormat("%b %Y");
    cursorFormat = d3.timeFormat("%b %d, %Y");
  } else if (timeRange < oneYear * 2) {
    ticks = d3.timeMonth.range(start, end);
    format = (date: Date) => {
      const isFirstMonthOfYear = date.getMonth() === 0;
      return isFirstMonthOfYear
        ? d3.timeFormat("%Y")(date)
        : d3.timeFormat("%b %Y")(date);
    };
    cursorFormat = d3.timeFormat("%b %d, %Y");
  } else if (timeRange < oneYear * 4) {
    const adjustedStart = d3.timeYear.floor(start);
    ticks = d3.timeMonth.range(adjustedStart, end, 3);
    format = (date: Date) => {
      const isFirstMonthOfYear = date.getMonth() === 0;
      return isFirstMonthOfYear
        ? d3.timeFormat("%Y")(date)
        : d3.timeFormat("%b %Y")(date);
    };
    cursorFormat = d3.timeFormat("%b %d, %Y");
  } else {
    const adjustedStart = d3.timeYear.floor(start);
    ticks = d3.timeMonth.range(adjustedStart, end, 6);
    format = (date: Date) => {
      const isFirstMonthOfYear = date.getMonth() === 0;
      return isFirstMonthOfYear
        ? d3.timeFormat("%Y")(date)
        : d3.timeFormat("%b %Y")(date);
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
  } else if (range_min === null || range_max === null) {
    scaled_location = x;
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
  questionType: QuestionType,
  precision?: number,
  truncation?: number
): string {
  precision = precision ?? 3;
  truncation = truncation ?? 0;
  if (questionType === QuestionType.Date) {
    let dateFormat: string;
    if (precision <= 1) {
      dateFormat = "yyyy";
    } else if (precision <= 2) {
      dateFormat = truncation < 1 ? "yyyy-MM" : "MM";
    } else if (precision <= 3) {
      dateFormat =
        truncation < 1 ? "yyyy-MM-dd" : truncation < 2 ? "MM-dd" : "dd";
    } else {
      dateFormat =
        truncation < 1
          ? "yyyy-MM-dd HH:mm"
          : truncation < 2
            ? "MM-dd HH:mm"
            : truncation < 3
              ? "dd HH:mm"
              : "HH:mm";
    }
    return format(fromUnixTime(value), dateFormat);
  } else if (questionType === QuestionType.Numeric) {
    // TODO add truncation to abbreviatedNumber
    return abbreviatedNumber(value, precision);
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
  questionType: QuestionType,
  scaling: Scaling,
  precision?: number,
  truncation?: number
): string {
  if (value === undefined) {
    return "...";
  }
  const scaledValue = scaleInternalLocation(value, scaling);
  return displayValue(scaledValue, questionType, precision, truncation);
}

export function getChoiceOptionValue(
  value: number,
  questionType?: QuestionType,
  scaling?: Scaling
) {
  if (isNil(value)) {
    return `?`;
  }
  const rMin = scaling?.range_min ?? 0;
  const rMax = scaling?.range_max ?? 1;
  const zPoint = scaling?.zero_point ?? null;
  const scaledValue = scaleInternalLocation(value, {
    range_min: rMin ?? 0,
    range_max: rMax ?? 1,
    zero_point: zPoint,
  });
  switch (questionType) {
    case QuestionType.Numeric:
      return getForecastNumericDisplayValue(scaledValue);
    case QuestionType.Date:
      return getForecastDateDisplayValue(scaledValue);
    case QuestionType.Binary:
    default:
      return getForecastPctDisplayValue(value);
  }
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
    return format(fromUnixTime(scaledValue), "yyyy-MM-dd");
  } else if (qType === QuestionType.Numeric) {
    return abbreviatedNumber(scaledValue);
  } else {
    return `${Math.round(scaledValue * 100)}%`;
  }
}

type GenerateScaleParams = {
  displayType: QuestionType | "percent";
  axisLength: number;
  direction?: "horizontal" | "vertical";
  domain?: Tuple<number>;
  scaling?: Scaling | null;
  displayLabel?: string;
  withCursorFormat?: boolean;
  cursorDisplayLabel?: string | null;
};

/**
 * Flexible utility function for generating ticks and tick formats
 * for any axis
 *
 * @param displayType the type of the data, either "date", "numeric",
 *  or "percent". "percent" is a special case that will set other values
 *  automatically
 * @param axisLength the length of the axis in pixels which
 *  can be used to determine the number of ticks
 * @param domain the domain of the data, defaults to [0, 1],
 *  but for dates can be the min and max unix timestamps
 * @param scaling the Scaling related to the data, defaults to null
 *  which in turn is the same as a linear scaling along the given domain
 * @param displayLabel this is the label that will be appended to the
 *  formatted tick values, defaults to an empty string
 * @param withCursorFormat whether or not to generate a special cursor
 *  format for the hover state
 * @param cursorDisplayLabel specifies the label to appear on the cursor
 *  state, which defaults to the displayLabel
 *
 * @returns returns a Scale object with ticks, tickFormat, and cursorFormat
 */
export function generateScale({
  displayType,
  axisLength,
  direction = "horizontal",
  domain = [0, 1],
  scaling = null,
  displayLabel = "",
  withCursorFormat = false,
  cursorDisplayLabel = null,
}: GenerateScaleParams): Scale {
  const domainMin = domain[0];
  const domainMax = domain[1];
  const domainSize = domainMax - domainMin;
  const domainScaling = {
    range_min: domainMin,
    range_max: domainMax,
    zero_point: null,
  };

  const rangeMin = scaling?.range_min ?? domainMin;
  const rangeMax = scaling?.range_max ?? domainMax;
  const rangeSize = rangeMax - rangeMin;
  const zeroPoint = scaling?.zero_point ?? null;
  const rangeScaling = {
    range_min: rangeMin,
    range_max: rangeMax,
    zero_point: zeroPoint,
  };

  // determine the number of ticks to label
  // based on the axis length and direction
  let maxLabelCount: number;
  if (axisLength < 100) {
    maxLabelCount = direction === "horizontal" ? 2 : 3;
  } else if (axisLength < 150) {
    maxLabelCount = direction === "horizontal" ? 3 : 5;
  } else if (axisLength < 300) {
    maxLabelCount = direction === "horizontal" ? 5 : 6;
  } else if (axisLength < 500) {
    maxLabelCount = direction === "horizontal" ? 6 : 11;
  } else if (axisLength < 800) {
    maxLabelCount = direction === "horizontal" ? 6 : 21;
  } else if (axisLength < 1200) {
    maxLabelCount = direction === "horizontal" ? 11 : 21;
  } else {
    maxLabelCount = direction === "horizontal" ? 21 : 26;
  }
  const tickCount = (maxLabelCount! - 1) * 5 + 1;

  // console.log({
  //   displayType,
  //   axisLength,
  //   domain,
  //   scaling,
  //   displayLabel,
  //   withCursorFormat,
  //   cursorDisplayLabel,
  //   maxLabelCount,
  //   tickCount,
  //   domainScaling,
  //   rangeScaling,
  // });

  if (displayType === "percent") {
    // special case for "percent" situation
    displayLabel = "%";
    const tickInterval = domainMax / (tickCount - 1);
    const labeledTickInterval = domainMax / (maxLabelCount - 1);
    return {
      ticks: range(domainMin, domainMax + tickInterval / 2, tickInterval),
      tickFormat: (x) => {
        if (Math.round(x * 100) % Math.round(labeledTickInterval * 100) === 0) {
          return `${Math.round(x * 100)}` + displayLabel;
        }
        return "";
      },
      cursorFormat: withCursorFormat
        ? (x) => `${Math.round(x * 10000) / 100}` + displayLabel
        : undefined,
    };
  }

  const tickInterval = 1 / (tickCount - 1);
  const labeledTickInterval = 1 / (maxLabelCount - 1);
  const majorTicks: number[] = range(
    0,
    1 + tickInterval / 100,
    labeledTickInterval
  ).map((x) => Math.round(x * 1000) / 1000);
  const allTicks: number[] = range(0, 1 + tickInterval / 100, tickInterval).map(
    (x) => Math.round(x * 1000) / 1000
  );
  return {
    ticks: allTicks,
    tickFormat: (x) => {
      if (majorTicks.includes(Math.round(x * 1000) / 1000)) {
        const unscaled = unscaleNominalLocation(x, domainScaling);
        return (
          getDisplayValue(
            unscaled,
            displayType as QuestionType,
            rangeScaling,
            3
          ) + displayLabel
        );
      }
      return "";
    },
    cursorFormat: (x) => {
      const unscaled = unscaleNominalLocation(x, domainScaling);
      return (
        getDisplayValue(
          unscaled,
          displayType as QuestionType,
          rangeScaling,
          6
        ) + displayLabel
      );
    },
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
  const choiceItems = choiceOrdering.map((order, index) => {
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
  const resolutionIndex = choiceOrdering.findIndex(
    (order) => question.options![order] === question.resolution
  );
  if (resolutionIndex !== -1) {
    const [resolutionItem] = choiceItems.splice(resolutionIndex, 1);
    choiceItems.unshift(resolutionItem);
  }
  return choiceItems.map((item, index) => ({
    ...item,
    active: !!activeCount ? index <= activeCount - 1 : true,
  }));
}

export function generateChoiceItemsFromBinaryGroup(
  questions: QuestionWithNumericForecasts[],
  config?: {
    withMinMax?: boolean;
    activeCount?: number;
    preselectedQuestionId?: number;
    locale?: string;
    preserveOrder?: boolean;
  }
): ChoiceItem[] {
  const { activeCount, preselectedQuestionId, locale } = config ?? {};

  const latests: (AggregateForecast | undefined)[] = questions.map(
    (question) => question.aggregations.recency_weighted.latest
  );
  if (latests.length == 0) {
    return [];
  }
  const choiceOrdering: number[] = latests.map((_, i) => i);
  if (!config?.preserveOrder) {
    choiceOrdering.sort((a, b) => {
      const aCenter = latests[a]?.centers![0] ?? 0;
      const bCenter = latests[b]?.centers![0] ?? 0;
      return bCenter - aCenter;
    });
  }

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
      closeTime: Math.min(
        new Date(question.scheduled_close_time).getTime(),
        new Date(
          question.actual_resolve_time ?? question.scheduled_resolve_time
        ).getTime()
      ),
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      active: preselectedQuestionId
        ? preselectedQuestionId === question.id
        : !!activeCount
          ? index <= activeCount - 1
          : true,
      highlighted: false,
      resolution: question.resolution,
      rangeMin: question.scaling.range_min ?? 0,
      rangeMax: question.scaling.range_min ?? 1,
      scaling: question.scaling,
      displayedResolution: !!question.resolution
        ? formatResolution(question.resolution, question.type, locale ?? "en")
        : null,
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

export function getFanOptionsFromBinaryGroup(
  questions: QuestionWithNumericForecasts[]
) {
  return questions
    .map((q) => {
      const aggregation = q.aggregations.recency_weighted.latest;
      const resolved = q.resolution !== null;
      return {
        name: extractQuestionGroupName(q.title),
        quartiles: {
          median: aggregation?.centers?.[0] ?? 0,
          lower25: aggregation?.interval_lower_bounds?.[0] ?? 0,
          upper75: aggregation?.interval_upper_bounds?.[0] ?? 0,
        },
        resolved,
        question: q,
        resolvedAt: new Date(q.scheduled_resolve_time),
      };
    })
    .sort((a, b) => differenceInMilliseconds(a.resolvedAt, b.resolvedAt));
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
    (prev, curr) => (curr <= timestamp && curr > prev ? curr : prev),
    0
  );
}

export const getChartZoomOptions = () =>
  Object.values(TimelineChartZoomOption).map((zoomOption) => ({
    label: zoomOption,
    value: zoomOption,
  }));

export const getClosestYValue = (xValue: number, line: Line) => {
  const i = findLastIndex(line, (point) => point.x <= xValue);
  const p1 = line[i];
  const p2 = line[i + 1];

  if (!p1 || !p2) return 0;

  if (Math.abs(p2.x - xValue) > Math.abs(p1.x - xValue)) {
    return p1.y;
  }
  return p2.y;
};

export const interpolateYValue = (xValue: number, line: Line) => {
  const i = findLastIndex(line, (point) => point.x <= xValue);
  const p1 = line[i];
  const p2 = line[i + 1];

  if (!p1 || !p2) return 0;

  const t = (xValue - p1.x) / (p2.x - p1.x);
  return p1.y + t * (p2.y - p1.y);
};

export function getLeftPadding(
  yScale: Scale,
  labelsFontSize: number,
  yLabel?: string | undefined
) {
  const labels = yScale.ticks.map((tick) => yScale.tickFormat(tick));
  const longestLabelLength = Math.max(...labels.map((label) => label.length));
  const fontSizeScale = yLabel ? 9 : 8;
  return {
    leftPadding: Math.round(
      (longestLabelLength * labelsFontSize * fontSizeScale) / 10
    ),
    MIN_LEFT_PADDING: 50,
  };
}

export function getTickLabelFontSize(actualTheme: VictoryThemeDefinition) {
  const fontSize = Array.isArray(actualTheme.axis?.style?.tickLabels)
    ? actualTheme.axis?.style?.tickLabels[0]?.fontSize
    : actualTheme.axis?.style?.tickLabels?.fontSize;
  return fontSize as number;
}

export function getContinuousGroupScaling(
  questions: QuestionWithNumericForecasts[]
) {
  const zeroPoints: number[] = [];
  questions.forEach((question) => {
    if (question.scaling.zero_point !== null) {
      zeroPoints.push(question.scaling.zero_point);
    }
  });
  const scaling: Scaling = {
    range_max: Math.max(
      ...questions.map((question) => question.scaling.range_max!)
    ),
    range_min: Math.min(
      ...questions.map((question) => question.scaling.range_min!)
    ),
    zero_point: zeroPoints.length > 0 ? Math.min(...zeroPoints) : null,
  };
  // we can have mixes of log and linear scaled options
  // which leads to a derived zero point inside the range which is invalid
  // so just igore the log scaling in this case
  if (
    scaling.zero_point !== null &&
    scaling.range_min! <= scaling.zero_point &&
    scaling.zero_point <= scaling.range_max!
  ) {
    scaling.zero_point = null;
  }
  return scaling;
}

export function getResolutionPoint({
  questionType,
  resolution,
  resolveTime,
  scaling,
}: {
  questionType: QuestionType;
  resolution: Resolution;
  resolveTime: number;
  scaling: Scaling;
}) {
  if (isUnsuccessfullyResolved(resolution)) {
    return null;
  }

  switch (questionType) {
    case QuestionType.Binary: {
      // format data for binary question
      return [
        {
          y:
            resolution === "no"
              ? scaling.range_min ?? 0
              : scaling.range_max ?? 1,
          x: resolveTime,
          symbol: "diamond",
          size: 4,
        },
      ];
    }
    case QuestionType.Numeric: {
      // format data for numerical question
      const unscaledResolution = unscaleNominalLocation(
        Number(resolution),
        scaling
      );

      return [
        {
          y: unscaledResolution,
          x: resolveTime,
          symbol: "diamond",
          size: 4,
        },
      ];
    }
    case QuestionType.Date: {
      // format data for date question
      const dateTimestamp = new Date(resolution).getTime() / 1000;
      const unscaledResolution = unscaleNominalLocation(dateTimestamp, scaling);

      return [
        {
          y: unscaledResolution,
          x: resolveTime,
          symbol: "diamond",
          size: 4,
        },
      ];
    }
    default:
      return null;
  }
}
