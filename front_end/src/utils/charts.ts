import * as d3 from "d3";
import {
  differenceInMilliseconds,
  format,
  fromUnixTime,
  getUnixTime,
  subDays,
  subMonths,
} from "date-fns";
import { findLastIndex, isNil, range, uniq } from "lodash";
import { Tuple, VictoryThemeDefinition } from "victory";

import { ContinuousAreaGraphInput } from "@/components/charts/continuous_area_chart";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import {
  ContinuousAreaType,
  ContinuousForecastInputType,
  FanOption,
  Line,
  Scale,
  TimelineChartZoomOption,
} from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { QuestionStatus, Resolution } from "@/types/post";
import {
  AggregateForecast,
  AggregateForecastHistory,
  Bounds,
  DefaultInboundOutcomeCount,
  Question,
  QuestionType,
  QuestionWithForecasts,
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
  Scaling,
  UserForecast,
  UserForecastHistory,
} from "@/types/question";
import { cdfToPmf, computeQuartilesFromCDF } from "@/utils/math";
import { abbreviatedNumber } from "@/utils/number_formatters";
import {
  formatMultipleChoiceResolution,
  formatResolution,
  formatValueUnit,
  isUnitCompact,
  isUnsuccessfullyResolved,
} from "@/utils/questions";

import {
  extractPrevBinaryForecastValue,
  extractPrevNumericForecastValue,
  getForecastDateDisplayValue,
  getForecastNumericDisplayValue,
  getForecastPctDisplayValue,
  getQuantileNumericForecastDataset,
  getSliderNumericForecastDataset,
  populateQuantileComponents,
} from "./forecasts";

export function getContinuousChartTypeFromQuestion(
  type: QuestionType
): QuestionType | undefined {
  switch (type) {
    case QuestionType.Numeric:
      return QuestionType.Numeric;
    case QuestionType.Date:
      return QuestionType.Date;
    case QuestionType.Discrete:
      return QuestionType.Discrete;
    case QuestionType.Binary:
      return QuestionType.Binary;
    default:
      return undefined;
  }
}

export function generateNumericXDomain(
  timestamps: number[],
  zoom: TimelineChartZoomOption
): Tuple<number> {
  const validTimestamps = uniq(timestamps.filter((t) => t !== null));
  const latestTimestamp = validTimestamps.at(-1);
  if (latestTimestamp === undefined) {
    return [0, 0];
  }
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
      startDate = fromUnixTime(Math.min(...validTimestamps));
  }

  return [
    Math.max(Math.min(...validTimestamps), getUnixTime(startDate)),
    latestTimestamp,
  ];
}

type GenerateYDomainParams = {
  minValues: Array<{ timestamp: number; y: number | null | undefined }>;
  maxValues: Array<{ timestamp: number; y: number | null | undefined }>;
  minTimestamp: number;
  zoom: TimelineChartZoomOption;
  isChartEmpty: boolean;
  zoomDomainPadding?: number;
};

export function generateYDomain({
  zoom,
  isChartEmpty,
  minValues,
  maxValues,
  minTimestamp,
  zoomDomainPadding = 0.05,
}: GenerateYDomainParams): {
  originalYDomain: Tuple<number>;
  zoomedYDomain: Tuple<number>;
} {
  const originalYDomain: Tuple<number> = [0, 1];
  const fallback = { originalYDomain, zoomedYDomain: originalYDomain };

  if (zoom === TimelineChartZoomOption.All || isChartEmpty) {
    return fallback;
  }

  const min = minValues
    .filter((d) => d.timestamp >= minTimestamp)
    .map((d) => d.y)
    .filter((value): value is number => !isNil(value));
  const minValue = min.length ? Math.min(...min) : null;
  const max = maxValues
    .filter((d) => d.timestamp >= minTimestamp)
    .map((d) => d.y)
    .filter((value): value is number => !isNil(value));
  const maxValue = max.length ? Math.max(...max) : null;

  if (isNil(minValue) || isNil(maxValue)) {
    return fallback;
  }

  return {
    originalYDomain,
    zoomedYDomain: [
      Math.max(0, minValue - zoomDomainPadding),
      Math.min(1, maxValue + zoomDomainPadding),
    ],
  };
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
  const { range_min, range_max, zero_point } = scaling;
  if (isNil(range_max) || isNil(range_min)) {
    return x;
  }

  let scaled_location: number;
  if (zero_point !== null) {
    const derivRatio = (range_max - zero_point) / (range_min - zero_point);
    scaled_location =
      range_min +
      ((range_max - range_min) * (derivRatio ** x - 1)) / (derivRatio - 1);
  } else if (range_min === null || range_max === null) {
    scaled_location = x;
  } else {
    scaled_location = range_min + (range_max - range_min) * x;
  }
  return scaled_location;
}

/**
 * unscales a nominal location within a range of range_min to range_max
 * to an internal location within a range of 0 to 1
 * taking into account any logarithmic scaling determined by zero_point
 */
export function unscaleNominalLocation(x: number, scaling: Scaling) {
  const { range_min, range_max, zero_point } = scaling;
  if (isNil(range_max) || isNil(range_min)) {
    return x;
  }

  let unscaled_location: number;
  if (zero_point !== null) {
    const derivRatio = (range_max - zero_point) / (range_min - zero_point);
    unscaled_location =
      Math.log(
        ((x - range_min) * (derivRatio - 1)) / (range_max - range_min) + 1
      ) / Math.log(derivRatio);
  } else {
    unscaled_location = (x - range_min) / (range_max - range_min);
  }
  return unscaled_location;
}

export function displayValue({
  value,
  questionType,
  actual_resolve_time,
  precision,
  scaling,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  truncation,
  dateFormatString,
  unit,
  adjustLabels = false,
}: {
  value: number | null;
  questionType: QuestionType;
  actual_resolve_time: string | null;
  precision?: number;
  scaling?: Scaling;
  truncation?: number;
  dateFormatString?: string;
  unit?: string;
  adjustLabels?: boolean;
}): string {
  if (value === null) {
    return "...";
  }
  precision = precision ?? 3;
  if (questionType === QuestionType.Date && scaling) {
    const dateFormat = getQuestionDateFormatString({
      scaling,
      actual_resolve_time,
      valueTimestamp: value,
      includeRefTime: adjustLabels,
    });
    return format(fromUnixTime(value), dateFormatString ?? dateFormat);
  } else if (
    questionType === QuestionType.Numeric ||
    questionType === QuestionType.Discrete
  ) {
    // TODO add truncation to abbreviatedNumber
    return formatValueUnit(
      abbreviatedNumber(value, precision, false, scaling),
      unit
    );
  } else {
    return `${Math.round(value * 1000) / 10}%`;
  }
}

/**
 * Returns the display value of an internal location given the
 * details of the question
 *
 * Accepts a Question or the individual parameters of a Question
 */
export function getDisplayValue({
  value,
  questionType,
  scaling,
  actual_resolve_time,
  precision,
  truncation,
  range,
  dateFormatString,
  unit,
  adjustLabels = false,
  skipQuartilesBorders = false,
}: {
  value: number | null | undefined;
  questionType: QuestionType;
  scaling: Scaling;
  actual_resolve_time: string | null;
  precision?: number;
  truncation?: number;
  range?: number[];
  dateFormatString?: string;
  unit?: string;
  adjustLabels?: boolean;
  skipQuartilesBorders?: boolean; // remove "<" or ">" from the formatted value if the value is out of the quartiles
}): string {
  if (value === undefined || value === null) {
    return "...";
  }
  const scaledValue = scaleInternalLocation(value, scaling);
  const centerDisplay =
    checkQuartilesOutOfBorders(skipQuartilesBorders ? undefined : value) +
    displayValue({
      value: scaledValue,
      questionType,
      precision,
      truncation,
      scaling,
      actual_resolve_time,
      dateFormatString,
      unit,
      adjustLabels,
    });
  if (range) {
    const lowerX = range[0];
    const upperX = range[1];
    if (isNil(lowerX) || isNil(upperX)) {
      return "...";
    }
    const scaledLower = scaleInternalLocation(lowerX, scaling);
    const lowerDisplay =
      checkQuartilesOutOfBorders(skipQuartilesBorders ? undefined : lowerX) +
      displayValue({
        value: scaledLower,
        questionType,
        precision,
        actual_resolve_time,
        scaling,
        truncation,
        dateFormatString,
        adjustLabels,
      });
    const scaledUpper = scaleInternalLocation(upperX, scaling);
    const upperDisplay =
      checkQuartilesOutOfBorders(skipQuartilesBorders ? undefined : upperX) +
      displayValue({
        value: scaledUpper,
        questionType,
        precision,
        actual_resolve_time,
        scaling,
        truncation,
        dateFormatString,
        adjustLabels,
      });
    return `${centerDisplay} \n(${lowerDisplay} - ${upperDisplay})`;
  }
  return centerDisplay;
}

export function getTableDisplayValue({
  value,
  questionType,
  actual_resolve_time,
  scaling,
  precision,
  truncation,
  range,
  forecastInputMode = ContinuousForecastInputType.Slider,
  unit,
}: {
  value: number | null | undefined;
  questionType: QuestionType;
  actual_resolve_time: string | null;
  scaling: Scaling;
  precision?: number;
  truncation?: number;
  range?: number[];
  forecastInputMode?: ContinuousForecastInputType;
  unit?: string;
}) {
  if (isNil(value)) {
    return "...";
  }

  if (forecastInputMode === ContinuousForecastInputType.Quantile) {
    return displayValue({
      value,
      questionType,
      scaling,
      actual_resolve_time,
      precision,
      truncation,
    });
  }

  const formatted_value = getDisplayValue({
    value,
    questionType,
    scaling,
    actual_resolve_time,
    precision,
    truncation,
    range,
  });

  return isUnitCompact(unit)
    ? formatValueUnit(formatted_value, unit)
    : formatted_value;
}

export function getQuestionDateFormatString({
  scaling,
  actual_resolve_time,
  valueTimestamp,
  includeRefTime = false,
}: {
  scaling: Scaling;
  actual_resolve_time: string | null;
  valueTimestamp: number;
  includeRefTime?: boolean;
}) {
  const { range_min, range_max } = scaling;
  let dateFormat = "dd MMM yyyy HH:mm";
  if (!isNil(range_min) && !isNil(range_max)) {
    const scaleDiffInSeconds = range_max - range_min;
    const oneWeek = 7 * 24 * 60 * 60;
    const oneYear = 365.25 * 24 * 60 * 60;
    const ref =
      Math.min(
        Date.now(),
        actual_resolve_time
          ? new Date(actual_resolve_time).getTime()
          : Date.now()
      ) / 1000;
    const refDiffInSeconds = Math.abs(ref - valueTimestamp);
    const diffInSeconds = Math.min(
      scaleDiffInSeconds,
      includeRefTime ? scaleDiffInSeconds : refDiffInSeconds
    );
    if (diffInSeconds < oneWeek) {
      dateFormat = "dd MMM yyyy HH:mm";
    } else if (diffInSeconds < 5 * oneYear) {
      dateFormat = "dd MMM yyyy";
    } else if (diffInSeconds < 50 * oneYear) {
      dateFormat = "MMM yyyy";
    } else {
      dateFormat = "yyyy";
    }
  }
  return dateFormat;
}

export function getChoiceOptionValue({
  value,
  questionType,
  scaling,
  actual_resolve_time,
}: {
  value: number | null;
  questionType?: QuestionType;
  scaling?: Scaling;
  actual_resolve_time?: string | null;
}) {
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
    case QuestionType.Discrete:
      return getForecastNumericDisplayValue(scaledValue);
    case QuestionType.Date:
      return getForecastDateDisplayValue(
        scaledValue,
        scaling,
        actual_resolve_time
      );
    case QuestionType.Binary:
    default:
      return getForecastPctDisplayValue(value);
  }
}

export function getUserPredictionDisplayValue({
  myForecasts,
  timestamp,
  questionType,
  scaling,
  actual_resolve_time,
  showRange,
  unit,
}: {
  myForecasts: UserForecastHistory;
  timestamp: number | null | undefined;
  questionType: Question | QuestionType;
  scaling?: Scaling;
  actual_resolve_time: string | null;
  showRange?: boolean;
  unit?: string;
}): string {
  if (!timestamp) {
    return "...";
  }

  let closestUserForecastIndex = -1;
  myForecasts?.history.forEach((forecast, index) => {
    if (
      forecast.start_time <= timestamp &&
      (!forecast.end_time || forecast.end_time > timestamp)
    ) {
      closestUserForecastIndex = index;
    }
  });
  if (closestUserForecastIndex === -1) {
    return "...";
  }
  const closestUserForecast = myForecasts.history[closestUserForecastIndex];
  if (!closestUserForecast) {
    return "...";
  }

  let center: number | undefined;
  let lower: number | undefined = undefined;
  let upper: number | undefined = undefined;
  if (questionType === QuestionType.Binary) {
    center = closestUserForecast.forecast_values[1];
  } else {
    center = closestUserForecast.centers?.[0];
    lower = showRange
      ? closestUserForecast.interval_lower_bounds?.[0]
      : undefined;
    upper = showRange
      ? closestUserForecast.interval_upper_bounds?.[0]
      : undefined;
  }
  if (isNil(center)) {
    return "...";
  }

  const scaledCenter = scaleInternalLocation(
    center,
    scaling ?? { range_min: 0, range_max: 1, zero_point: null }
  );
  const scaledLower = !isNil(lower)
    ? scaleInternalLocation(
        lower,
        scaling ?? { range_min: 0, range_max: 1, zero_point: null }
      )
    : null;
  const scaledUpper = !isNil(upper)
    ? scaleInternalLocation(
        upper,
        scaling ?? { range_min: 0, range_max: 1, zero_point: null }
      )
    : null;

  if (questionType === QuestionType.Date) {
    const displayCenter = getDisplayValue({
      value: center,
      questionType,
      scaling: scaling ?? { range_min: 0, range_max: 1, zero_point: null },
      actual_resolve_time,
    });
    if (showRange) {
      const displayLower = !isNil(lower)
        ? getDisplayValue({
            value: lower,
            questionType,
            scaling: scaling ?? {
              range_min: 0,
              range_max: 1,
              zero_point: null,
            },
            actual_resolve_time,
          })
        : "...";
      const displayUpper = !isNil(upper)
        ? getDisplayValue({
            value: upper,
            questionType,
            scaling: scaling ?? {
              range_min: 0,
              range_max: 1,
              zero_point: null,
            },
            actual_resolve_time,
          })
        : "...";
      return `${displayCenter}\n(${displayLower} - ${displayUpper})`;
    }

    return displayCenter;
  } else if (
    questionType === QuestionType.Numeric ||
    questionType === QuestionType.Discrete
  ) {
    const displayCenter =
      checkQuartilesOutOfBorders(center) +
      formatValueUnit(abbreviatedNumber(scaledCenter), unit);
    if (showRange) {
      const displayLower = !isNil(scaledLower)
        ? checkQuartilesOutOfBorders(lower) + abbreviatedNumber(scaledLower)
        : "...";
      const displayUpper = !isNil(scaledUpper)
        ? checkQuartilesOutOfBorders(upper) + abbreviatedNumber(scaledUpper)
        : "...";
      return `${displayCenter}\n(${displayLower} - ${displayUpper})`;
    }
    return displayCenter;
  } else {
    return `${Math.round(scaledCenter * 1000) / 10}%`;
  }
}

type GenerateScaleParams = {
  displayType: QuestionType;
  axisLength: number;
  direction?: "horizontal" | "vertical";
  domain?: Tuple<number>;
  zoomedDomain?: Tuple<number>;
  scaling?: Scaling | null;
  unit?: string;
  withCursorFormat?: boolean;
  cursorDisplayLabel?: string | null;
  forcedTickCount?: number;
  shortLabels?: boolean;
  adjustLabels?: boolean;
};

/**
 * Flexible utility function for generating ticks and tick formats
 * for any axis
 *
 * @param displayType the type of the data, either "date", "numeric",
 *  or "binary".
 * @param axisLength the length of the axis in pixels which
 *  can be used to determine the number of ticks
 * @param domain the domain of the data, defaults to [0, 1],
 *  but for dates can be the min and max unix timestamps
 * @param scaling the Scaling related to the data, defaults to null
 *  which in turn is the same as a linear scaling along the given domain
 * @param unit this is the label that will be appended to the
 *  formatted tick values, defaults to an empty string
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
  zoomedDomain = [0, 1],
  scaling = null,
  unit,
  forcedTickCount,
  shortLabels = false,
  adjustLabels = false,
}: GenerateScaleParams): Scale {
  const domainMin = domain[0];
  const domainMax = domain[1];
  const domainScaling = {
    range_min: domainMin,
    range_max: domainMax,
    zero_point: null,
  };

  const rangeMin = scaling?.range_min ?? domainMin;
  const rangeMax = scaling?.range_max ?? domainMax;
  const zeroPoint = scaling?.zero_point ?? null;
  const rangeScaling = {
    range_min: rangeMin,
    range_max: rangeMax,
    zero_point: zeroPoint,
  };

  const zoomedDomainMin = zoomedDomain[0];
  const zoomedDomainMax = zoomedDomain[1];

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
  const tickCount =
    displayType === QuestionType.Discrete
      ? forcedTickCount ?? (maxLabelCount - 1) * 5 + 1
      : (maxLabelCount - 1) * 5 + 1;

  // TODO: this does not support choosing values intelligently in
  // real scaling. The y-axis is always a domain of 0-1 with
  // linear scaling as that is the native format for the
  // forecast data. To get this to intelligently choose ticks and
  // labels, this operation will have to be done in the real
  // scaling first, then transformed back into the domain scale.
  const zoomedRange = zoomedDomainMax - zoomedDomainMin;
  let minorRes: number = 1;
  let majorRes: number = 1;
  let minorTickInterval: number;
  let tickStart: number;
  let tickEnd: number;
  let minorTicks: number[];
  let majorTickStart: number;
  let majorTickInterval: number;
  let majorTicks: number[];

  if (displayType === QuestionType.Discrete) {
    // First and last ticks are 1/2 a bucket width away from the
    // boarders
    tickStart = Math.round(1e7 * (0.5 / tickCount)) / 1e7;
    tickEnd = Math.round(1e7 * (1 - 0.5 / tickCount)) / 1e7;
    minorTickInterval = Math.round(1e9 / tickCount) / 1e9;
    minorTicks = range(tickStart, tickEnd + 1e-4, minorTickInterval).map(
      (x) => Math.round(x * 10000) / 10000
    );
    majorTickStart = tickStart;
    majorTickInterval =
      minorTickInterval * Math.max(1, Math.round(tickCount / maxLabelCount));
    majorTicks = range(majorTickStart, tickEnd + 1e-4, majorTickInterval).map(
      (x) => Math.round(x * 10000) / 10000
    );
    if (!(majorTicks.at(-1) === tickEnd)) {
      majorTicks.push(tickEnd);
    }
  } else {
    if (zoomedRange > 0.7) {
      minorRes = 0.02; // only tick on multiples of 0.05
      majorRes = 0.1; // only label on multiples of 0.25
    } else if (zoomedRange > 0.5) {
      minorRes = 0.005; // only tick on multiples of 0.025
      majorRes = 0.05; // only label on multiples of 0.10
    } else if (zoomedRange > 0.1) {
      minorRes = 0.005; // only tick on multiples of 0.01
      majorRes = 0.025; // only label on multiples of 0.05
    } else if (zoomedRange > 0.05) {
      minorRes = 0.002; // only tick on multiples of 0.005
      majorRes = 0.01; // only label on multiples of 0.025
    } else {
      minorRes = 0.001; // only tick on multiples of 0.0025
      majorRes = 0.005; // only label on multiples of 0.01
    }

    minorTickInterval =
      Math.round(zoomedRange / (tickCount - 1) / minorRes) * minorRes;
    tickStart = Math.round(zoomedDomainMin / minorRes) * minorRes;
    tickEnd =
      Math.round((zoomedDomainMax + minorTickInterval / 100) / minorRes) *
      minorRes *
      1.001;
    minorTicks = range(tickStart, tickEnd, minorTickInterval).map(
      (x) => Math.round(x * 10000) / 10000
    );

    majorTickInterval =
      Math.round(zoomedRange / (maxLabelCount - 1) / majorRes) * majorRes;
    majorTickStart = Math.round(zoomedDomainMin / majorRes) * majorRes;
    majorTicks = range(majorTickStart, tickEnd, majorTickInterval).map(
      (x) => Math.round(x * 10000) / 10000
    );
  }

  // if (direction == "horizontal") {
  //   // Debugging - do not remove
  //   console.log(
  //     "\n displayType:",
  //     displayType,
  //     "\n axisLength:",
  //     axisLength,
  //     "\n domain:",
  //     domain,
  //     "\n zoomedDomain:",
  //     zoomedDomain,
  //     "\n zoomedRange:",
  //     zoomedRange,
  //     "\n scaling:",
  //     scaling,
  //     "\n unit:",
  //     unit,
  //     "\n forcedTickCount:",
  //     forcedTickCount,
  //     "\n maxLabelCount:",
  //     maxLabelCount,
  //     "\n tickCount:",
  //     tickCount,
  //     "\n domainScaling:",
  //     domainScaling,
  //     "\n rangeScaling:",
  //     rangeScaling,
  //     "\n minorRes:",
  //     minorRes,
  //     "\n majorRes:",
  //     majorRes,
  //     "\n tickStart:",
  //     tickStart,
  //     "\n tickEnd:",
  //     tickEnd,
  //     "\n minorTickInterval:",
  //     minorTickInterval,
  //     "\n minorTicks:",
  //     minorTicks,
  //     "\n majorTickInterval:",
  //     majorTickInterval,
  //     "\n majorTicks:",
  //     majorTicks
  //   );
  // }

  const conditionallyShowUnit = (value: string, idx?: number): string => {
    if (!unit) return value;

    // Include unit if it's within the length limit
    if (isUnitCompact(unit)) return formatValueUnit(value, unit);

    // Include unit only for the first and last tick in horizontal mode
    if (
      direction === "horizontal" &&
      (idx === 0 || idx === minorTicks.length - 1)
    ) {
      return formatValueUnit(value, unit);
    }

    return value;
  };

  function tickFormat(x: number, idx?: number) {
    if (majorTicks.includes(Math.round(x * 10000) / 10000)) {
      const unscaled = unscaleNominalLocation(x, domainScaling);
      return conditionallyShowUnit(
        getDisplayValue({
          value: unscaled,
          questionType: displayType as QuestionType,
          scaling: rangeScaling,
          precision: 3,
          actual_resolve_time: null,
          dateFormatString: shortLabels ? "yyyy" : undefined,
          adjustLabels,
          skipQuartilesBorders: true,
        }),
        idx
      );
    }
    return "";
  }

  function cursorFormat(x: number, idx?: number) {
    const unscaled = unscaleNominalLocation(x, domainScaling);
    return conditionallyShowUnit(
      getDisplayValue({
        value: unscaled,
        questionType: displayType as QuestionType,
        scaling: rangeScaling,
        precision: 6,
        actual_resolve_time: null,
      }),
      idx
    );
  }

  return {
    ticks: minorTicks,
    tickFormat: tickFormat,
    cursorFormat: cursorFormat,
  };
}

export function generateChoiceItemsFromMultipleChoiceForecast(
  question: QuestionWithMultipleChoiceForecasts,
  config?: {
    withMinMax?: boolean;
    activeCount?: number;
    preselectedQuestionId?: number;
    locale?: string;
    preserveOrder?: boolean;
  }
): ChoiceItem[] {
  const { activeCount, preserveOrder } = config ?? {};

  const latest = question.aggregations.recency_weighted.latest;

  const choiceOrdering: number[] = question.options?.map((_, i) => i) ?? [];
  if (!preserveOrder) {
    choiceOrdering.sort((a, b) => {
      const aCenter = latest?.forecast_values[a] ?? 0;
      const bCenter = latest?.forecast_values[b] ?? 0;
      return bCenter - aCenter;
    });
  }

  const labels = question.options ? question.options : [];
  const aggregationHistory = question.aggregations.recency_weighted.history;
  const userHistory = question.my_forecasts?.history;

  const aggregationTimestamps: number[] = [];
  aggregationHistory.forEach((forecast) => {
    aggregationTimestamps.push(forecast.start_time);
    if (forecast.end_time) {
      aggregationTimestamps.push(forecast.end_time);
    }
  });
  const sortedAggregationTimestamps = uniq(aggregationTimestamps).sort(
    (a, b) => a - b
  );
  const userTimestamps: number[] = [];
  userHistory?.forEach((forecast) => {
    userTimestamps.push(forecast.start_time);
    if (forecast.end_time) {
      userTimestamps.push(forecast.end_time);
    }
  });
  const sortedUserTimestamps = uniq(userTimestamps).sort((a, b) => a - b);

  const choiceItems: ChoiceItem[] = labels.map((choice, index) => {
    const userValues: (number | null)[] = [];
    const aggregationValues: (number | null)[] = [];
    const aggregationMinValues: (number | null)[] = [];
    const aggregationMaxValues: (number | null)[] = [];
    const aggregationForecasterCounts: number[] = [];
    sortedUserTimestamps.forEach((timestamp) => {
      const userForecast = userHistory?.find((forecast) => {
        return (
          forecast.start_time <= timestamp &&
          (forecast.end_time === null || forecast.end_time > timestamp)
        );
      });
      userValues.push(userForecast?.forecast_values[index] || null);
    });
    sortedAggregationTimestamps.forEach((timestamp) => {
      const aggregationForecast = aggregationHistory.find((forecast) => {
        return (
          forecast.start_time <= timestamp &&
          (forecast.end_time === null || forecast.end_time > timestamp)
        );
      });
      aggregationValues.push(
        !!aggregationForecast?.centers
          ? aggregationForecast.centers[index] ?? null
          : null
      );
      aggregationMinValues.push(
        !!aggregationForecast?.interval_lower_bounds
          ? aggregationForecast.interval_lower_bounds[index] ?? null
          : null
      );
      aggregationMaxValues.push(
        !!aggregationForecast?.interval_upper_bounds
          ? aggregationForecast.interval_upper_bounds[index] ?? null
          : null
      );
      aggregationForecasterCounts.push(
        aggregationForecast?.forecaster_count || 0
      );
    });

    return {
      choice: choice,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      highlighted: false,
      active: true,
      resolution: question.resolution,
      displayedResolution: !!question.resolution
        ? formatMultipleChoiceResolution(question.resolution, choice)
        : null,
      aggregationTimestamps: sortedAggregationTimestamps,
      aggregationValues: aggregationValues,
      aggregationMinValues: aggregationMinValues,
      aggregationMaxValues: aggregationMaxValues,
      aggregationForecasterCounts: aggregationForecasterCounts,
      userTimestamps: sortedUserTimestamps,
      userValues: userValues,
      actual_resolve_time: question.actual_resolve_time ?? null,
    };
  });
  // reorder choice items
  const orderedChoiceItems = choiceOrdering.map((order) => choiceItems[order]);
  // move resolved choice to the front
  const resolutionIndex = choiceOrdering.findIndex(
    (order) => question.options?.[order] === question.resolution
  );
  if (resolutionIndex !== -1) {
    const [resolutionItem] = orderedChoiceItems.splice(resolutionIndex, 1);
    if (resolutionItem) {
      orderedChoiceItems.unshift(resolutionItem);
    }
  }
  // set inactive items
  if (activeCount) {
    orderedChoiceItems.forEach((item, index) => {
      if (!isNil(item)) {
        item.active = index < activeCount;
      }
    });
  }

  return orderedChoiceItems.filter((el) => !isNil(el)) as ChoiceItem[];
}

export function generateChoiceItemsFromGroupQuestions(
  questions: QuestionWithNumericForecasts[],
  config?: {
    activeCount?: number;
    preselectedQuestionId?: number;
    locale?: string;
    shortBounds?: boolean;
  }
): ChoiceItem[] {
  if (questions.length == 0) {
    return [];
  }
  const { activeCount, preselectedQuestionId, locale, shortBounds } =
    config ?? {};

  const preselectedQuestionLabel = preselectedQuestionId
    ? questions.find((q) => q.id === preselectedQuestionId)?.label
    : undefined;

  const choiceItems: ChoiceItem[] = questions.map((question, index) => {
    const label = question.label;
    const userHistory = question.my_forecasts?.history;

    const closeTime = Math.min(
      new Date(question.scheduled_close_time).getTime(),
      new Date(
        question.actual_resolve_time ?? question.scheduled_resolve_time
      ).getTime()
    );

    const aggregationHistory =
      question.aggregations.recency_weighted.history.filter((forecast) => {
        return forecast.start_time * 1000 < closeTime;
      });

    const aggregationTimestamps: number[] = [];
    aggregationHistory.forEach((forecast) => {
      aggregationTimestamps.push(forecast.start_time);
      if (forecast.end_time) {
        aggregationTimestamps.push(forecast.end_time);
      }
    });

    if (
      question.status === QuestionStatus.RESOLVED ||
      question.status === QuestionStatus.CLOSED
    ) {
      aggregationTimestamps.push(closeTime / 1000);
    }

    const sortedAggregationTimestamps = uniq(aggregationTimestamps).sort(
      (a, b) => a - b
    );
    const userTimestamps: number[] = [];
    userHistory?.forEach((forecast) => {
      userTimestamps.push(forecast.start_time);
      if (forecast.end_time) {
        userTimestamps.push(forecast.end_time);
      }
    });
    const sortedUserTimestamps = uniq(userTimestamps).sort((a, b) => a - b);

    const userValues: (number | null)[] = [];
    const userMinValues: (number | null)[] = [];
    const userMaxValues: (number | null)[] = [];
    const aggregationValues: (number | null)[] = [];
    const aggregationMinValues: (number | null)[] = [];
    const aggregationMaxValues: (number | null)[] = [];
    const aggregationForecasterCounts: number[] = [];
    sortedUserTimestamps.forEach((timestamp) => {
      const userForecast = userHistory?.find((forecast) => {
        return (
          forecast.start_time <= timestamp &&
          (forecast.end_time === null || forecast.end_time > timestamp)
        );
      });
      if (question.type === QuestionType.Binary) {
        userValues.push(userForecast?.forecast_values[1] ?? null);
      } else {
        // continuous
        userValues.push(userForecast?.centers?.[0] ?? null);
        userMinValues.push(userForecast?.interval_lower_bounds?.[0] ?? null);
        userMaxValues.push(userForecast?.interval_upper_bounds?.[0] ?? null);
      }
    });
    sortedAggregationTimestamps.forEach((timestamp) => {
      const aggregationForecast = aggregationHistory.findLast((forecast) => {
        return (
          forecast.start_time <= timestamp &&
          (forecast.end_time === null || forecast.end_time >= timestamp)
        );
      });
      aggregationValues.push(aggregationForecast?.centers?.[0] ?? null);
      aggregationMinValues.push(
        aggregationForecast?.interval_lower_bounds?.[0] ?? null
      );
      aggregationMaxValues.push(
        aggregationForecast?.interval_upper_bounds?.[0] ?? null
      );
      aggregationForecasterCounts.push(
        aggregationForecast?.forecaster_count ?? 0
      );
    });

    return {
      id: question.id,
      choice: label,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      highlighted: false,
      active: true,
      resolution: question.resolution,
      displayedResolution: !isNil(question.resolution)
        ? formatResolution({
            resolution: question.resolution,
            questionType: question.type,
            locale: locale ?? "en",
            scaling: question.scaling,
            unit: question.unit,
            actual_resolve_time: question.actual_resolve_time ?? null,
            shortBounds: shortBounds,
          })
        : null,
      closeTime,
      actual_resolve_time: question.actual_resolve_time ?? null,
      unit: question.unit,
      rangeMin: question.scaling.range_min ?? 0,
      rangeMax: question.scaling.range_min ?? 1,
      scaling: question.scaling,
      aggregationTimestamps: sortedAggregationTimestamps,
      aggregationValues: aggregationValues,
      aggregationMinValues: aggregationMinValues,
      aggregationMaxValues: aggregationMaxValues,
      aggregationForecasterCounts: aggregationForecasterCounts,
      userTimestamps: sortedUserTimestamps,
      userValues: userValues,
      userMinValues:
        question.type === QuestionType.Binary ? undefined : userMinValues, // used in continuous group questions
      userMaxValues:
        question.type === QuestionType.Binary ? undefined : userMaxValues, // used in continuous group questions
    };
  });
  if (activeCount) {
    choiceItems.forEach((item, index) => {
      if (preselectedQuestionLabel) {
        item.active = preselectedQuestionLabel === item.choice;
      } else {
        item.active = index < activeCount;
      }
    });
  }
  return choiceItems;
}

export function getFanOptionsFromContinuousGroup(
  questions: QuestionWithNumericForecasts[]
): FanOption[] {
  return questions
    .map((q) => {
      const latest = q.my_forecasts?.latest;
      const userForecast = extractPrevNumericForecastValue(
        latest && !latest.end_time ? latest.distribution_input : undefined
      );

      let userCdf: number[] | null = null;
      if (userForecast?.components) {
        userForecast.type === ContinuousForecastInputType.Slider
          ? (userCdf = getSliderNumericForecastDataset(
              userForecast.components,
              q.open_lower_bound,
              q.open_upper_bound,
              q.inbound_outcome_count ?? DefaultInboundOutcomeCount
            ).cdf)
          : (userCdf = getQuantileNumericForecastDataset(
              populateQuantileComponents(userForecast.components),
              q
            ).cdf);
      }

      return {
        name: q.label,
        communityCdf:
          q.aggregations.recency_weighted.latest?.forecast_values ?? [],
        userCdf: userCdf,
        resolved: q.resolution !== null,
        question: q,
      };
    })
    .map(({ name, communityCdf, resolved, question, userCdf }) => ({
      name,
      communityQuartiles: communityCdf.length
        ? computeQuartilesFromCDF(communityCdf) ?? null
        : null,
      communityBounds: getCdfBounds(communityCdf) ?? null,
      userQuartiles: userCdf?.length ? computeQuartilesFromCDF(userCdf) : null,
      userBounds: userCdf ? getCdfBounds(userCdf) ?? null : null,
      resolved,
      question,
    }));
}

export function getFanOptionsFromBinaryGroup(
  questions: QuestionWithNumericForecasts[]
): FanOption[] {
  return questions.map((q) => {
    const aggregation = q.aggregations.recency_weighted.latest;
    const resolved = q.resolution !== null;

    const latest = q.my_forecasts?.latest;
    const userForecast = extractPrevBinaryForecastValue(
      latest && !latest.end_time ? latest.forecast_values[1] : null
    );

    return {
      name: q.label,
      communityQuartiles: !!aggregation
        ? {
            median: aggregation.centers?.[0] ?? 0,
            lower25: aggregation.interval_lower_bounds?.[0] ?? 0,
            upper75: aggregation.interval_upper_bounds?.[0] ?? 0,
          }
        : null,
      communityBounds: null,
      userQuartiles: userForecast
        ? {
            lower25: userForecast / 100,
            median: userForecast / 100,
            upper75: userForecast / 100,
          }
        : null,
      userBounds: null,
      resolved,
      question: q,
    };
  });
}

export function getQuestionTimestamps(
  question: QuestionWithForecasts
): number[] {
  return uniq([
    ...question.aggregations.recency_weighted.history.map((x) => x.start_time),
    ...question.aggregations.recency_weighted.history.map(
      (x) => x.end_time ?? x.start_time
    ),
  ]).sort((a, b) => a - b);
}

export function getGroupQuestionsTimestamps(
  questions: QuestionWithNumericForecasts[],
  options?: {
    withUserTimestamps?: boolean;
  }
): number[] {
  const { withUserTimestamps } = options ?? {};

  if (withUserTimestamps) {
    return uniq(
      questions.reduce<number[]>(
        (acc, question) => [
          ...acc,
          ...(question.my_forecasts?.history?.map((x) => x.start_time) ?? []),
          ...(question.my_forecasts?.history?.map(
            (x) => x.end_time ?? x.start_time
          ) ?? []),
        ],
        []
      )
    ).sort((a, b) => a - b);
  }

  return uniq(
    questions.reduce<number[]>(
      (acc, question) => [
        ...acc,
        ...question.aggregations.recency_weighted.history.map(
          (x) => x.start_time
        ),
        ...question.aggregations.recency_weighted.history.map(
          (x) => x.end_time ?? x.start_time
        ),
        // add user timestamps to display new forecast tooltip without page refresh
        ...(question.my_forecasts?.history?.map((x) => x.start_time) ?? []),
        ...(question.my_forecasts?.history?.map(
          (x) => x.end_time ?? x.start_time
        ) ?? []),
      ],
      []
    )
  ).sort((a, b) => a - b);
}

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

export const getChartZoomOptions = () =>
  Object.values(TimelineChartZoomOption).map((zoomOption) => ({
    label: zoomOption,
    value: zoomOption,
  }));

export const getClosestYValue = (xValue: number, line: Line) => {
  const i = findLastIndex(line, (point) => point.x <= xValue);
  const p1 = line[i];
  const p2 = line[i + 1];
  if (!!p1?.y && !!p2?.y) {
    if (Math.abs(p2.x - xValue) > Math.abs(p1.x - xValue)) {
      return p1.y;
    }
    return p2.y;
  }
  if (!!p1?.y) return p1.y;
  if (!!p2?.y) return p2.y;
  return 0;
};

export const getClosestXValue = (xValue: number, line: Line) => {
  const i = findLastIndex(line, (point) => point.x <= xValue);
  const p1 = line[i];
  const p2 = line[i + 1];
  if (!!p1 && !!p2) {
    if (Math.abs(p2.x - xValue) > Math.abs(p1.x - xValue)) {
      return p1.x;
    }
    return p2.x;
  }
  if (p1) return p1.x;
  if (p2) return p2.x;
  return 0;
};

export const interpolateYValue = (xValue: number, line: Line) => {
  const i = findLastIndex(line, (point) => point.x <= xValue);
  const p1 = line[i];
  const p2 = line[i + 1] ?? line[i];

  if (!p1?.y || !p2?.y) return 0;

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
  const rangeMaxPoints: number[] = [];
  const rangeMinPoints: number[] = [];
  const zeroPoints: number[] = [];
  questions.forEach((question) => {
    if (question.scaling.range_max !== null) {
      rangeMaxPoints.push(question.scaling.range_max);
    }

    if (question.scaling.range_min !== null) {
      rangeMinPoints.push(question.scaling.range_min);
    }

    if (question.scaling.zero_point !== null) {
      zeroPoints.push(question.scaling.zero_point);
    }
  });
  const scaling: Scaling = {
    range_max: rangeMaxPoints.length > 0 ? Math.max(...rangeMaxPoints) : null,
    range_min: rangeMinPoints.length > 0 ? Math.min(...rangeMinPoints) : null,
    zero_point: zeroPoints.length > 0 ? Math.min(...zeroPoints) : null,
  };
  // we can have mixes of log and linear scaled options
  // which leads to a derived zero point inside the range which is invalid
  // so just igore the log scaling in this case
  if (
    scaling.zero_point !== null &&
    !isNil(scaling.range_min) &&
    !isNil(scaling.range_max) &&
    scaling.range_min <= scaling.zero_point &&
    scaling.zero_point <= scaling.range_max
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
    case QuestionType.Numeric:
    case QuestionType.Discrete: {
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

export function getResolutionPosition({
  question,
  scaling,
  adjustBinaryPoint = false,
}: {
  question: Question;
  scaling: Scaling;
  adjustBinaryPoint?: boolean;
}) {
  const resolution = question.resolution;
  if (isNil(resolution)) {
    // fallback, usually we don't expect this, as function will be called only for resolved questions
    return 0;
  }
  if (adjustBinaryPoint && ["no", "yes"].includes(resolution as string)) {
    return 0.4;
  }

  if (
    ["no", "below_lower_bound", "annulled", "ambiguous"].includes(
      resolution as string
    )
  ) {
    return 0;
  } else if (["yes", "above_upper_bound"].includes(resolution as string)) {
    return 1;
  } else {
    return question.type === QuestionType.Numeric ||
      question.type === QuestionType.Discrete
      ? unscaleNominalLocation(Number(resolution), scaling)
      : unscaleNominalLocation(new Date(resolution).getTime() / 1000, scaling);
  }
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
  } else if (cursorTimestamp === null && isNil(aggregation.latest?.end_time)) {
    forecastIndex = aggregation.history.length - 1;
  }
  return forecastIndex === -1
    ? null
    : aggregation.history[forecastIndex] ?? null;
}

export function getCdfBounds(cdf: number[] | undefined): Bounds | undefined {
  if (!cdf) {
    return;
  }

  const start = cdf.at(0);
  const end = cdf.at(-1);
  if (isNil(start) || isNil(end)) {
    return;
  }

  return {
    belowLower: start,
    aboveUpper: 1 - end,
  };
}

export function getContinuousAreaChartData(
  latest: AggregateForecast | undefined,
  userForecast: UserForecast | undefined,
  userCustomForecast?: {
    cdf: number[];
    pmf: number[];
  },
  isClosedForecast?: boolean
): ContinuousAreaGraphInput {
  const chartData: ContinuousAreaGraphInput = [];

  if (latest && !latest.end_time) {
    chartData.push({
      pmf: cdfToPmf(latest.forecast_values),
      cdf: latest.forecast_values,
      type: (isClosedForecast
        ? "community_closed"
        : "community") as ContinuousAreaType,
    });
  }

  if (userCustomForecast) {
    chartData.push({
      pmf: userCustomForecast.pmf,
      cdf: userCustomForecast.cdf,
      type: "user" as ContinuousAreaType,
    });
  } else if (!!userForecast && !userForecast.end_time) {
    chartData.push({
      pmf: cdfToPmf(userForecast.forecast_values),
      cdf: userForecast.forecast_values,
      type: "user" as ContinuousAreaType,
    });
  }

  return chartData;
}
export function calculateTextWidth(fontSize: number, text: string): number {
  if (typeof document === "undefined") {
    return 0;
  }
  const element = document.createElement("span");
  element.style.visibility = "hidden";
  element.style.position = "absolute";
  element.style.whiteSpace = "nowrap";
  element.style.fontSize = `${fontSize}px`;
  element.textContent = text;

  document.body.appendChild(element);
  const textWidth = element.offsetWidth;
  document.body.removeChild(element);

  return textWidth;
}

export function calculateCharWidth(fontSize: number, text?: string): number {
  if (typeof document === "undefined") {
    return 0;
  }

  const element = document.createElement("span");
  element.style.visibility = "hidden";
  element.style.position = "absolute";
  element.style.whiteSpace = "nowrap";
  element.style.fontSize = `${fontSize}px`;
  const sampleText =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  element.textContent = text ?? sampleText;

  document.body.appendChild(element);
  const charWidth = element.offsetWidth / sampleText.length;
  document.body.removeChild(element);

  return charWidth;
}

export function getTruncatedLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) {
    return label;
  }
  return label.slice(0, maxLength).trim() + "...";
}

export function checkQuartilesOutOfBorders(quartile: number | undefined) {
  return quartile === 0 ? "<" : quartile === 1 ? ">" : "";
}
