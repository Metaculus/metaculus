import * as d3 from "d3";
import {
  differenceInMilliseconds,
  fromUnixTime,
  getUnixTime,
  subDays,
  subMonths,
} from "date-fns";
import { isNil, range, uniq } from "lodash";
import { Tuple, VictoryThemeDefinition } from "victory";

import {
  Scale,
  ScaleDirection,
  TimelineChartZoomOption,
  YDomain,
} from "@/types/charts";
import {
  DefaultInboundOutcomeCount,
  GraphingQuestionProps,
  Question,
  QuestionType,
  Scaling,
} from "@/types/question";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { scaleInternalLocation, unscaleNominalLocation } from "@/utils/math";
import { formatValueUnit, isUnitCompact } from "@/utils/questions/units";

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

export function getTickLabelFontSize(actualTheme: VictoryThemeDefinition) {
  const fontSize = Array.isArray(actualTheme.axis?.style?.tickLabels)
    ? actualTheme.axis?.style?.tickLabels[0]?.fontSize
    : actualTheme.axis?.style?.tickLabels?.fontSize;
  return fontSize as number;
}

export function getAxisLeftPadding(
  yScale: Scale,
  labelsFontSize: number,
  yLabel?: string | undefined
) {
  const labels = yScale.ticks.map((tick) => yScale.tickFormat(tick));
  const longestLabelLength = Math.min(
    Math.max(...labels.map((label) => label.length)),
    12
  );
  const fontSizeScale = yLabel ? 9 : 8;
  return {
    leftPadding: Math.round(
      (longestLabelLength * labelsFontSize * fontSizeScale) / 10
    ),
    MIN_LEFT_PADDING: 50,
  };
}

// Width reserved on the right margin for a rotated (270°) yLabel/axis title.
// Rotated text occupies its fontSize horizontally (centered on its anchor
// after rotation); we reserve enough space to fit an Inter 11px glyph plus
// gaps on both sides — gap to tick labels on the left and gap to the
// container edge on the right.
export const Y_AXIS_LABEL_RESERVED_PX = 20;
// Distance from chartWidth to the rotated yLabel's anchor x. With default
// textAnchor="middle", the label spans ±fontSize/2 around this point, so
// the anchor must sit at least fontSize/2 + a small gap inside the edge to
// avoid being clipped.
export const Y_AXIS_LABEL_ANCHOR_OFFSET = 12;

export function getAxisRightPadding(
  yScale: Scale,
  labelsFontSize: number,
  yLabel?: string | undefined
) {
  const SCATTER_POINT_PADDING = 5;
  const labels = yScale.ticks.map((tick) => yScale.tickFormat(tick));
  const longestLabelLength = Math.min(
    Math.max(...labels.map((label) => label.length)),
    12
  );
  const tickLabelsWidth =
    Math.round((longestLabelLength * labelsFontSize * 9) / 10) +
    SCATTER_POINT_PADDING;
  return {
    rightPadding: tickLabelsWidth + (yLabel ? Y_AXIS_LABEL_RESERVED_PX : 0),
    MIN_RIGHT_PADDING: 35,
  };
}

type GenerateYDomainParams = {
  minValues: Array<{ timestamp: number; y: number | null | undefined }>;
  maxValues: Array<{ timestamp: number; y: number | null | undefined }>;
  minTimestamp: number;
  maxTimestamp?: number;
  zoom: TimelineChartZoomOption;
  isChartEmpty: boolean;
  zoomDomainPadding?: number;
  includeClosestBoundOnZoom?: boolean;
  forceAutoZoom?: boolean;
  useFullYDomain?: boolean;
  paddingRatio?: number;
};

export function generateTimeSeriesYDomain({
  zoom,
  isChartEmpty,
  minValues,
  maxValues,
  minTimestamp,
  maxTimestamp,
  zoomDomainPadding,
  includeClosestBoundOnZoom,
  forceAutoZoom,
  useFullYDomain,
  paddingRatio,
}: GenerateYDomainParams): YDomain {
  const originalYDomain: Tuple<number> = [0, 1];
  const fallback = { originalYDomain, zoomedYDomain: originalYDomain };

  if (
    (zoom === TimelineChartZoomOption.All &&
      !forceAutoZoom &&
      !useFullYDomain) ||
    isChartEmpty
  ) {
    return fallback;
  }

  const shouldIncludeValue = (timestamp: number) =>
    useFullYDomain ||
    (timestamp >= minTimestamp &&
      (isNil(maxTimestamp) || timestamp <= maxTimestamp));

  const min = minValues
    .filter((d) => shouldIncludeValue(d.timestamp))
    .map((d) => d.y)
    .filter((value) => !isNil(value));
  const minValue = min.length ? Math.min(...min) : null;
  const max = maxValues
    .filter((d) => shouldIncludeValue(d.timestamp))
    .map((d) => d.y)
    .filter((value) => !isNil(value));
  const maxValue = max.length ? Math.max(...max) : null;

  if (isNil(minValue) || isNil(maxValue)) {
    return fallback;
  }

  return generateYDomain({
    minValue,
    maxValue,
    zoomDomainPadding,
    paddingRatio,
    includeClosestBoundOnZoom,
  });
}

export function generateYDomain({
  minValue,
  maxValue,
  zoomDomainPadding = 0.05,
  paddingRatio,
  includeClosestBoundOnZoom = false,
}: {
  minValue: number;
  maxValue: number;
  zoomDomainPadding?: number;
  paddingRatio?: number;
  includeClosestBoundOnZoom?: boolean;
}): YDomain {
  const originalYDomain: Tuple<number> = [0, 1];
  const valueSpan = maxValue - minValue;
  const domainPadding =
    !isNil(paddingRatio) && valueSpan > 0
      ? valueSpan * Math.max(0, paddingRatio)
      : zoomDomainPadding;

  let zoomedYDomain: Tuple<number> = [0, 1];
  const distanceToZero = Math.abs(minValue - domainPadding);
  const distanceToOne = Math.abs(1 - (maxValue + domainPadding));

  if (includeClosestBoundOnZoom) {
    if (distanceToZero === distanceToOne) {
      zoomedYDomain = [0, 1];
    } else {
      // Include the closer bound
      zoomedYDomain =
        distanceToZero < distanceToOne
          ? [0, Math.min(1, maxValue + domainPadding)]
          : [Number(Math.max(0, minValue - domainPadding).toFixed(8)), 1];
    }
  } else {
    zoomedYDomain = [
      Number(Math.max(0, minValue - domainPadding).toFixed(8)),
      Math.min(1, maxValue + domainPadding),
    ];
  }

  return {
    originalYDomain,
    zoomedYDomain,
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

function getSigFigCost(value: number, logarithmic: boolean = false): number {
  const absValue = Math.abs(value);
  // take the length of mantissa of the exponential rounded
  // to 7 digits to avoid floating point precision issues
  const mantissa = absValue
    .toExponential(7)
    .replace(/e.*$/, "")
    .replace(".", "")
    .replace(/^0+|0+$/g, "");
  if (mantissa === "0") {
    return 0;
  }
  if (mantissa === "1") {
    return 0.5;
  }
  // TODO: consider discounting 25 and 75 more than 20, 40, 60, 80
  // but less than plain 50
  const lastDigit = mantissa.at(-1);
  if (!logarithmic) {
    if (mantissa === "5") {
      return 0.8;
    }
    // discount if the mantissa ends with a 5 by 0.5
    if (lastDigit === "5") {
      return mantissa.length - 0.5;
    }
    // discount if the mantissa ends with a 2, 4, 6, or 8 by 0.2
    if (["2", "4", "6", "8"].includes(lastDigit ?? "")) {
      return mantissa.length - 0.2;
    }
  } else {
    if (mantissa === "3") {
      return 0.8;
    }
    // discount if the mantissa ends with a 3 or 5
    if (["3", "5"].includes(lastDigit ?? "")) {
      return mantissa.length - 0.5;
    }
  }
  return mantissa.length;
}

const NICE_TICK_MULTIPLIERS = [1, 2, 2.5, 5];

/**
 * Returns the requested number of evenly spaced, round display values.
 * The sequence is positioned to follow the data range as closely as possible;
 * when two positions fit equally well, prefer the one aligned to the upper end.
 */
function niceTicksNearCount(
  start: number,
  stop: number,
  preferredCount: number
): number[] {
  if (!Number.isFinite(start) || !Number.isFinite(stop)) return [];
  if (start === stop) return [start];

  const count = Math.max(2, Math.round(preferredCount));
  const idealStep = Math.abs(stop - start) / (count - 1);
  const exponent = Math.floor(Math.log10(idealStep));
  const stepCandidates = [-1, 0, 1].flatMap((offset) =>
    NICE_TICK_MULTIPLIERS.map(
      (multiplier) => multiplier * 10 ** (exponent + offset)
    )
  );
  const step = stepCandidates.reduce((best, candidate) =>
    Math.abs(Math.log(candidate / idealStep)) <
    Math.abs(Math.log(best / idealStep))
      ? candidate
      : best
  );

  const tickSpan = step * (count - 1);
  const centeredStart = (start + stop - tickSpan) / (2 * step);
  const startIndices = Array.from(
    new Set([
      Math.floor(centeredStart),
      Math.ceil(centeredStart),
      Math.ceil(start / step),
      Math.floor(stop / step) - (count - 1),
    ])
  );
  const bestStartIndex = startIndices.reduce((best, candidate) => {
    const score = (index: number) => {
      const first = index * step;
      const last = first + tickSpan;
      return Math.abs(first - start) + Math.abs(last - stop);
    };
    const candidateScore = score(candidate);
    const bestScore = score(best);
    if (candidateScore < bestScore) return candidate;
    if (candidateScore === bestScore && candidate > best) return candidate;
    return best;
  });

  return range(0, count).map((index) => {
    const value = (bestStartIndex + index) * step;
    return Number(value.toPrecision(12));
  });
}

/** Keeps an aligned nice-tick sequence inside a question's hard bounds. */
function fitNiceTicksWithinRange(
  ticks: number[],
  rangeStart: number,
  rangeStop: number
): number[] {
  const lower = Math.min(rangeStart, rangeStop);
  const upper = Math.max(rangeStart, rangeStop);
  const tolerance = Math.max(1, Math.abs(lower), Math.abs(upper)) * 1e-12;
  const inRange = (value: number) =>
    value >= lower - tolerance && value <= upper + tolerance;

  if (ticks.length < 2) return ticks.filter(inRange);

  const step = (ticks[1] as number) - (ticks[0] as number);
  if (!(step > 0)) return ticks.filter(inRange);

  const tickSpan = step * (ticks.length - 1);
  const minimumStartIndex = Math.ceil((lower - tolerance) / step);
  const maximumStartIndex = Math.floor((upper - tickSpan + tolerance) / step);

  if (minimumStartIndex <= maximumStartIndex) {
    const currentStartIndex = Math.round((ticks[0] as number) / step);
    const fittedStartIndex = Math.max(
      minimumStartIndex,
      Math.min(maximumStartIndex, currentStartIndex)
    );
    return range(0, ticks.length).map((index) =>
      Number(((fittedStartIndex + index) * step).toPrecision(12))
    );
  }

  return ticks.filter(inRange);
}

/** Returns the next smaller interval from the nice-tick progression. */
function getNextSmallerNiceStep(step: number): number {
  const exponent = Math.floor(Math.log10(step));
  const candidates = [-1, 0].flatMap((offset) =>
    NICE_TICK_MULTIPLIERS.map(
      (multiplier) => multiplier * 10 ** (exponent + offset)
    )
  );

  return Math.max(
    ...candidates.filter((candidate) => candidate < step * (1 - 1e-12))
  );
}

/** Adds at most one tighter nice tick per side to cover plotted values. */
function addGuardTicksToCoverRange(
  ticks: number[],
  coverageRange: Tuple<number> | undefined,
  hardRange?: Tuple<number>
): number[] {
  if (!coverageRange || ticks.length < 2) return ticks;

  const first = ticks[0] as number;
  const last = ticks.at(-1) as number;
  const step = (ticks[1] as number) - first;
  if (!(step > 0)) return ticks;
  const boundaryStep = getNextSmallerNiceStep(step);

  const coverageLower = Math.min(...coverageRange);
  const coverageUpper = Math.max(...coverageRange);
  const hardLower = hardRange ? Math.min(...hardRange) : -Infinity;
  const hardUpper = hardRange ? Math.max(...hardRange) : Infinity;
  const tolerance =
    Math.max(1, Math.abs(coverageLower), Math.abs(coverageUpper)) * 1e-12;
  const guardedTicks = ticks.slice();

  if (coverageLower < first - tolerance) {
    const lowerGuard = Number((first - boundaryStep).toPrecision(12));
    if (lowerGuard < first - tolerance && lowerGuard >= hardLower - tolerance) {
      guardedTicks.unshift(lowerGuard);
    }
  }
  if (coverageUpper > last + tolerance) {
    const upperGuard = Number((last + boundaryStep).toPrecision(12));
    if (upperGuard > last + tolerance && upperGuard <= hardUpper + tolerance) {
      guardedTicks.push(upperGuard);
    }
  }

  return guardedTicks;
}

/** Ensures chart content is not clipped when nice ticks extend its domain. */
export function widenDomainToTicks(
  domain: Tuple<number>,
  ticks: number[]
): Tuple<number> {
  if (!ticks.length) return domain;
  return [Math.min(domain[0], ...ticks), Math.max(domain[1], ...ticks)];
}

/**
 * Take a range's min and max and finds the tick spacing that minimizes
 * the average number of significant digits in the tick values.
 * If two tick counts are equally good, returns the higher one.
 * Only works for linear scales.
 */
function findOptimalTickCount(
  rangeMin: number,
  rangeMax: number,
  minTicks: number,
  maxTicks: number
): number {
  // TODO: refactor to make this more generic, instead returning optimal ticks
  // and accepting logarithmic scaling
  let bestTickCount = maxTicks;
  let bestAvgDigits = Infinity;
  for (let i = maxTicks; i >= minTicks; i--) {
    const stepSize = (rangeMax - rangeMin) / (i - 1);
    const tickValues = range(0, i).map((j) => rangeMin + j * stepSize);
    const sigFigCosts = tickValues.map((value) => getSigFigCost(value));
    const avgDigits = sigFigCosts.reduce((sum, cost) => sum + cost, 0) / i;
    if (avgDigits < bestAvgDigits) {
      bestAvgDigits = avgDigits;
      bestTickCount = i;
    }
  }
  return bestTickCount;
}

type GenerateScaleParams = {
  displayType: QuestionType;
  axisLength: number;
  direction?: ScaleDirection;
  domain?: Tuple<number>;
  zoomedDomain?: Tuple<number>;
  scaling?: Scaling | null;
  unit?: string;
  withCursorFormat?: boolean;
  cursorDisplayLabel?: string | null;
  shortLabels?: boolean;
  adjustLabels?: boolean;
  inboundOutcomeCount?: number | null;
  question?: Question | GraphingQuestionProps;
  forceTickCount?: number;
  alwaysShowTicks?: boolean;
  tickCoverageDomain?: Tuple<number>;
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
  direction = ScaleDirection.Horizontal,
  domain = [0, 1],
  zoomedDomain = [0, 1],
  scaling = null,
  unit,
  shortLabels = false,
  adjustLabels = false,
  inboundOutcomeCount,
  question,
  forceTickCount,
  alwaysShowTicks,
  tickCoverageDomain,
}: GenerateScaleParams): Scale {
  const domainMin = domain[0];
  const domainMax = domain[1];
  const domainScaling = {
    range_min: domainMin,
    range_max: domainMax,
    zero_point: null,
  };

  const rangeMin =
    question?.scaling?.range_min ?? scaling?.range_min ?? domainMin;
  const rangeMax =
    question?.scaling?.range_max ?? scaling?.range_max ?? domainMax;
  const zeroPoint =
    question?.scaling?.zero_point ?? scaling?.zero_point ?? null;
  const inbound_outcome_count =
    question?.inbound_outcome_count ??
    inboundOutcomeCount ??
    DefaultInboundOutcomeCount;
  const rangeScaling = {
    range_min: rangeMin,
    range_max: rangeMax,
    zero_point: zeroPoint,
  };
  const tickCoverageRange: Tuple<number> | undefined = tickCoverageDomain
    ? (tickCoverageDomain.map((value) =>
        scaleInternalLocation(
          unscaleNominalLocation(value, domainScaling),
          rangeScaling
        )
      ) as Tuple<number>)
    : undefined;
  const [zoomedDomainMin, zoomedDomainMax] = zoomedDomain;
  let discreteValueOptions: number[] | undefined = undefined;
  if (
    displayType === QuestionType.Discrete &&
    inbound_outcome_count &&
    !isNil(rangeMin) &&
    !isNil(rangeMax)
  ) {
    discreteValueOptions = [];
    for (let i = 0; i < inbound_outcome_count; i++) {
      discreteValueOptions.push(
        rangeMin + ((rangeMax - rangeMin) * (i + 0.5)) / inbound_outcome_count
      );
    }
  }
  const openBoundCount =
    (question?.open_lower_bound ? 1 : 0) + (question?.open_upper_bound ? 1 : 0);
  // determine the number of ticks to label
  // based on the axis length and direction
  let maxLabelCount: number;
  if (
    displayType === QuestionType.Discrete &&
    direction === ScaleDirection.Horizontal
  ) {
    // look at the size of the last two labels to determine the max label count
    const lastLabel = getPredictionDisplayValue(
      1 - 0.5 / inbound_outcome_count,
      {
        questionType: displayType as QuestionType,
        scaling: rangeScaling,
        precision: 3,
        actual_resolve_time: null,
        dateFormatString: shortLabels ? "yyyy" : undefined,
        adjustLabels,
        skipQuartilesBorders: false,
        discreteValueOptions,
      }
    );
    const secondLastLabel = getPredictionDisplayValue(
      1 - 1.5 / inbound_outcome_count,
      {
        questionType: displayType as QuestionType,
        scaling: rangeScaling,
        precision: 3,
        actual_resolve_time: null,
        dateFormatString: shortLabels ? "yyyy" : undefined,
        adjustLabels,
        skipQuartilesBorders: false,
        discreteValueOptions,
      }
    );
    const labelLength = Math.max(secondLastLabel.length, lastLabel.length);
    maxLabelCount = Math.min(
      labelLength ? axisLength / (12 * labelLength) : 15,
      inbound_outcome_count + openBoundCount
    );
  } else if (axisLength < 100) {
    maxLabelCount = direction === ScaleDirection.Horizontal ? 2 : 3;
  } else if (axisLength < 150) {
    maxLabelCount = direction === ScaleDirection.Horizontal ? 3 : 5;
  } else if (axisLength < 300) {
    maxLabelCount = direction === ScaleDirection.Horizontal ? 5 : 6;
  } else if (axisLength < 500) {
    maxLabelCount = direction === ScaleDirection.Horizontal ? 6 : 11;
  } else if (axisLength < 800) {
    maxLabelCount = direction === ScaleDirection.Horizontal ? 7 : 21;
  } else if (axisLength < 1200) {
    maxLabelCount = direction === ScaleDirection.Horizontal ? 11 : 21;
  } else {
    maxLabelCount = direction === ScaleDirection.Horizontal ? 21 : 26;
  }

  let majorTicks: number[] = [];
  let minorTicks: number[] = [];
  const niceDisplayValuesByTick = new Map<number, number>();
  if (
    displayType === QuestionType.Discrete &&
    direction === ScaleDirection.Horizontal
  ) {
    const tickCount = forceTickCount
      ? Math.min(forceTickCount, inbound_outcome_count)
      : inbound_outcome_count + openBoundCount;

    const halfBucket = 0.5 / inbound_outcome_count;
    const tickStart = question?.open_lower_bound ? -halfBucket : halfBucket;
    const tickEnd = 1 + (question?.open_upper_bound ? halfBucket : -halfBucket);

    minorTicks = range(
      tickStart,
      tickEnd + 1e-4,
      1 / (tickCount - openBoundCount)
    ).map((x) => Math.round(x * 1000000) / 1000000);
    const step =
      Math.max(1, Math.ceil((tickCount - openBoundCount) / maxLabelCount)) /
      (tickCount - openBoundCount);
    majorTicks = range(tickStart, tickEnd - 0.6 * step, step).map(
      (x) => Math.round(x * 1000000) / 1000000
    );
    majorTicks.push(minorTicks.at(-1) ?? 1);
  } else if (isNil(zeroPoint)) {
    // Linear Scaling
    if (
      displayType === QuestionType.Numeric ||
      displayType === QuestionType.Discrete
    ) {
      // Choose nice values in display space, then map them back into the
      // chart's domain. This avoids awkward labels when the chart uses a
      // normalized [0, 1] domain for a wider numeric question range.
      const tickCountHint = Math.min(5, forceTickCount ?? maxLabelCount);
      const zoomedRangeMin = scaleInternalLocation(
        unscaleNominalLocation(zoomedDomainMin, domainScaling),
        rangeScaling
      );
      const zoomedRangeMax = scaleInternalLocation(
        unscaleNominalLocation(zoomedDomainMax, domainScaling),
        rangeScaling
      );
      const rangeToDomain = (value: number) =>
        scaleInternalLocation(
          unscaleNominalLocation(value, rangeScaling),
          domainScaling
        );
      const generatedNiceRangeTicks = niceTicksNearCount(
        Math.min(zoomedRangeMin, zoomedRangeMax),
        Math.max(zoomedRangeMin, zoomedRangeMax),
        tickCountHint
      );
      const boundedNiceRangeTicks =
        displayType === QuestionType.Discrete
          ? fitNiceTicksWithinRange(generatedNiceRangeTicks, rangeMin, rangeMax)
          : generatedNiceRangeTicks;
      const niceMajorRangeTicks = addGuardTicksToCoverRange(
        boundedNiceRangeTicks,
        tickCoverageRange,
        displayType === QuestionType.Discrete
          ? [Math.min(rangeMin, rangeMax), Math.max(rangeMin, rangeMax)]
          : undefined
      );

      majorTicks = niceMajorRangeTicks.map((value) => {
        const tick = Math.round(rangeToDomain(value) * 1000000) / 1000000;
        niceDisplayValuesByTick.set(tick, value);
        return tick;
      });

      const majorRangeStep =
        niceMajorRangeTicks.length >= 2
          ? (niceMajorRangeTicks[1] as number) -
            (niceMajorRangeTicks[0] as number)
          : zoomedRangeMax - zoomedRangeMin;
      const minorTicksPerMajor = findOptimalTickCount(
        0,
        majorRangeStep,
        direction === "horizontal" ? 4 : 2,
        direction === "horizontal" ? 10 : 5
      );
      const minorTickCount =
        Math.max(majorTicks.length - 1, 1) * minorTicksPerMajor + 1;
      const denseMinor = d3
        .ticks(zoomedRangeMin, zoomedRangeMax, minorTickCount)
        .map((value) => Math.round(rangeToDomain(value) * 1000000) / 1000000);

      // Major ticks must be present in the minor array because tickFormat
      // uses membership in majorTicks to decide which values get labels.
      minorTicks = Array.from(new Set([...majorTicks, ...denseMinor])).sort(
        (a, b) => a - b
      );
    } else {
      // Date and other non-numeric linear axes retain exact evenly-spaced
      // counts; d3 niceness is not meaningful for raw timestamps.
      const tickCount = Math.max(2, forceTickCount ?? maxLabelCount);
      const evenlySpaced = range(0, tickCount).map(
        (index) =>
          Math.round(
            (zoomedDomainMin +
              (index / (tickCount - 1)) * (zoomedDomainMax - zoomedDomainMin)) *
              1000000
          ) / 1000000
      );
      majorTicks = evenlySpaced;
      minorTicks = evenlySpaced.slice();
    }
  } else {
    // Logarithmic Scaling
    // Pick nice round values in display space and map each one back to the
    // warped domain so the labels remain readable on logarithmic questions.
    const tickCountHint = Math.min(5, forceTickCount ?? maxLabelCount);
    const displayMin = scaleInternalLocation(zoomedDomainMin, rangeScaling);
    const displayMax = scaleInternalLocation(zoomedDomainMax, rangeScaling);
    const generatedNiceRangeTicks = niceTicksNearCount(
      Math.min(displayMin, displayMax),
      Math.max(displayMin, displayMax),
      tickCountHint
    );
    const boundedNiceRangeTicks =
      displayType === QuestionType.Discrete
        ? fitNiceTicksWithinRange(generatedNiceRangeTicks, rangeMin, rangeMax)
        : generatedNiceRangeTicks;
    const niceMajorRangeTicks = addGuardTicksToCoverRange(
      boundedNiceRangeTicks,
      tickCoverageRange,
      displayType === QuestionType.Discrete
        ? [Math.min(rangeMin, rangeMax), Math.max(rangeMin, rangeMax)]
        : undefined
    );

    majorTicks = niceMajorRangeTicks.map((value) => {
      const tick =
        Math.round(unscaleNominalLocation(value, rangeScaling) * 1000000) /
        1000000;
      niceDisplayValuesByTick.set(tick, value);
      return tick;
    });

    const tickCount = forceTickCount
      ? forceTickCount
      : (maxLabelCount - 1) * (direction === "horizontal" ? 10 : 3) + 1;
    const minorTicksPerMajorInterval =
      (tickCount - 1) / Math.max(1, niceMajorRangeTicks.length - 1);
    minorTicks = majorTicks.slice();
    range(0, niceMajorRangeTicks.length - 1).forEach((i) => {
      const prevMajor = niceMajorRangeTicks.at(i) ?? 0;
      const nextMajor = niceMajorRangeTicks.at(i + 1) ?? 1;
      const step = (nextMajor - prevMajor) / minorTicksPerMajorInterval;
      for (let j = 0; j < minorTicksPerMajorInterval - 1; j++) {
        const newMinorTick = prevMajor + (j + 1) * step;
        minorTicks.push(unscaleNominalLocation(newMinorTick, rangeScaling));
      }
    });
  }

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
    if (
      alwaysShowTicks ||
      majorTicks.includes(Math.round(x * 1000000) / 1000000)
    ) {
      const niceDisplayValue = niceDisplayValuesByTick.get(
        Math.round(x * 1000000) / 1000000
      );
      if (!isNil(niceDisplayValue)) {
        return conditionallyShowUnit(
          getPredictionDisplayValue(niceDisplayValue, {
            questionType: displayType as QuestionType,
            precision: 3,
            actual_resolve_time: null,
            dateFormatString: shortLabels ? "yyyy" : undefined,
            adjustLabels,
            skipQuartilesBorders: true,
          }),
          idx
        );
      }
      if (
        displayType === QuestionType.Discrete &&
        direction === ScaleDirection.Horizontal
      ) {
        return conditionallyShowUnit(
          getPredictionDisplayValue(x, {
            questionType: displayType as QuestionType,
            scaling: rangeScaling,
            precision: 3,
            actual_resolve_time: null,
            dateFormatString: shortLabels ? "yyyy" : undefined,
            adjustLabels,
            skipQuartilesBorders: false,
            discreteValueOptions,
          }),
          idx
        );
      }
      const unscaled = unscaleNominalLocation(x, domainScaling);
      return conditionallyShowUnit(
        getPredictionDisplayValue(unscaled, {
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
    if (displayType === QuestionType.Discrete) {
      return conditionallyShowUnit(
        getPredictionDisplayValue(x, {
          questionType: displayType as QuestionType,
          scaling: rangeScaling,
          precision: 6,
          actual_resolve_time: null,
          discreteValueOptions,
        }),
        idx
      );
    }
    const unscaled = unscaleNominalLocation(x, domainScaling);
    return conditionallyShowUnit(
      getPredictionDisplayValue(unscaled, {
        questionType: displayType as QuestionType,
        scaling: rangeScaling,
        precision: 6,
        actual_resolve_time: null,
      }),
      idx
    );
  }

  // if (displayType === "numeric" && direction === "horizontal") {
  //   // Debugging - do not remove
  //   console.log(
  //     "\n displayType",
  //     displayType,
  //     "\n axisLength",
  //     axisLength,
  //     "\n direction",
  //     direction,
  //     "\n domain",
  //     domain,
  //     "\n zoomedDomain",
  //     zoomedDomain,
  //     "\n scaling",
  //     scaling,
  //     "\n unit",
  //     unit,
  //     "\n shortLabels",
  //     shortLabels,
  //     "\n adjustLabels",
  //     adjustLabels,
  //     "\n inboundOutcomeCount",
  //     inboundOutcomeCount,
  //     "\n question",
  //     question,
  //     "\n forceTickCount",
  //     forceTickCount,
  //     "\n alwaysShowTicks",
  //     alwaysShowTicks,
  //     "\n",
  //     "\n domainMin",
  //     domainMin,
  //     "\n domainMax",
  //     domainMax,
  //     "\n domainScaling",
  //     domainScaling,
  //     "\n rangeMin",
  //     rangeMin,
  //     "\n rangeMax",
  //     rangeMax,
  //     "\n zeroPoint",
  //     zeroPoint,
  //     "\n inbound_outcome_count",
  //     inbound_outcome_count,
  //     "\n rangeScaling",
  //     rangeScaling,
  //     "\n zoomedDomainMin",
  //     zoomedDomainMin,
  //     "\n zoomedDomainMax",
  //     zoomedDomainMax,
  //     "\n",
  //     "\n maxLabelCount",
  //     maxLabelCount,
  //     // "\n zoomedRange",
  //     // zoomedRange,
  //     // "\n minorRes",
  //     // minorRes,
  //     // "\n majorRes",
  //     // majorRes,
  //     // "\n minorTickInterval",
  //     // minorTickInterval,
  //     // "\n tickStart",
  //     // tickStart,
  //     // "\n tickEnd",
  //     // tickEnd,
  //     // "\n unscaledTargets",
  //     // unscaledTargets,
  //     // "\n scaledTargets",
  //     // scaledTargets,
  //     // "\n roundedScaledTargets",
  //     // roundedScaledTargets,
  //     // "\n minorTicksPerMajorInterval",
  //     // minorTicksPerMajorInterval,
  //     // "\n majorTickStart",
  //     // majorTickStart,
  //     // "\n majorTickInterval",
  //     // majorTickInterval,
  //     "\n minorTicks",
  //     minorTicks,
  //     "\n majorTicks",
  //     majorTicks,
  //     "\n",
  //     "\n discreteValueOptions:",
  //     discreteValueOptions,
  //     "\n tick labels:",
  //     minorTicks.map((x) => tickFormat(x))
  //   );
  // }

  return {
    // Callers using alwaysShowTicks label every returned value, so return the
    // selected major set rather than the denser minor grid in that mode.
    ticks: alwaysShowTicks ? majorTicks : minorTicks,
    tickFormat: tickFormat,
    cursorFormat: cursorFormat,
  };
}

type YMetaOptions = {
  gridlines?: number;
  padMin?: number;
  padRatio?: number;
  clamp?: [number, number] | null;
  axisPx?: number;
  direction?: ScaleDirection;
};

export function getYMeta(values: number[], opts: YMetaOptions = {}) {
  const {
    gridlines = 5,
    padMin = 0,
    padRatio = 0.1,
    clamp = null,
    axisPx = 300,
    direction = ScaleDirection.Vertical,
  } = opts;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const pad = Math.max(padMin, range * padRatio);

  const rawLo = Math.floor(min - pad);
  const rawHi = Math.ceil(max + pad);

  const lo = clamp ? Math.max(clamp[0], rawLo) : rawLo;
  const hi = clamp ? Math.min(clamp[1], rawHi) : rawHi;

  const { ticks } = generateScale({
    displayType: QuestionType.Numeric,
    axisLength: axisPx,
    direction,
    domain: [lo, hi],
    zoomedDomain: [lo, hi],
    forceTickCount: gridlines,
    alwaysShowTicks: true,
  });

  return { lo, hi, ticks };
}
