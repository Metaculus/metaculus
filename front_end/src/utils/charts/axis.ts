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

type TimestampedYValue = {
  timestamp: number;
  y: number | null | undefined;
};

export type TimeSeriesYDomainSource = {
  minValues: TimestampedYValue[];
  maxValues: TimestampedYValue[];
  /** Whether the last value before the visible window remains active within it. */
  carryForward?: boolean;
};

type GenerateYDomainParams = {
  sources: TimeSeriesYDomainSource[];
  timeRange: Tuple<number>;
  isChartEmpty: boolean;
  zoomDomainPadding?: number;
  includeClosestBoundOnZoom?: boolean;
  useFullYDomain?: boolean;
  paddingRatio?: number;
};

function getValuesActiveInTimeRange(
  values: TimestampedYValue[],
  timeRange: Tuple<number>,
  carryForward: boolean
): TimestampedYValue[] {
  const rangeStart = Math.min(...timeRange);
  const rangeEnd = Math.max(...timeRange);
  const valuesInRange = values.filter(
    ({ timestamp }) => timestamp >= rangeStart && timestamp <= rangeEnd
  );

  if (!carryForward) return valuesInRange;

  const valueActiveAtStart = values.reduce<TimestampedYValue | undefined>(
    (latest, value) =>
      value.timestamp < rangeStart &&
      (!latest || value.timestamp >= latest.timestamp)
        ? value
        : latest,
    undefined
  );

  return !valueActiveAtStart || isNil(valueActiveAtStart.y)
    ? valuesInRange
    : [{ ...valueActiveAtStart, timestamp: rangeStart }, ...valuesInRange];
}

export function generateTimeSeriesYDomain({
  isChartEmpty,
  sources,
  timeRange,
  zoomDomainPadding,
  includeClosestBoundOnZoom,
  useFullYDomain,
  paddingRatio,
}: GenerateYDomainParams): YDomain & {
  tickCoverageDomain: Tuple<number> | undefined;
} {
  const originalYDomain: Tuple<number> = [0, 1];
  const fallback = {
    originalYDomain,
    zoomedYDomain: originalYDomain,
    tickCoverageDomain: undefined,
  };

  if (isChartEmpty) {
    return fallback;
  }

  const selectValues = (values: TimestampedYValue[], carryForward: boolean) =>
    useFullYDomain
      ? values
      : getValuesActiveInTimeRange(values, timeRange, carryForward);
  const min = sources
    .flatMap(({ minValues, carryForward }) =>
      selectValues(minValues, !!carryForward)
    )
    .map((d) => d.y)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value)
    );
  const minValue = min.length ? Math.min(...min) : null;
  const max = sources
    .flatMap(({ maxValues, carryForward }) =>
      selectValues(maxValues, !!carryForward)
    )
    .map((d) => d.y)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value)
    );
  const maxValue = max.length ? Math.max(...max) : null;

  if (isNil(minValue) || isNil(maxValue)) {
    return fallback;
  }

  return {
    ...generateYDomain({
      minValue,
      maxValue,
      zoomDomainPadding,
      paddingRatio,
      includeClosestBoundOnZoom,
    }),
    tickCoverageDomain: [minValue, maxValue],
  };
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
  const domainPadding = !isNil(paddingRatio)
    ? valueSpan > 0
      ? valueSpan * Math.max(0, paddingRatio)
      : Math.min(zoomDomainPadding, 0.01)
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
const MAX_NUMERIC_MAJOR_TICK_COUNT = 6;

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

/**
 * Finds the densest single-step nice lattice that covers the requested range
 * without exceeding the label count. If hard bounds make full coverage
 * impossible, use the closest legal aligned window instead of an exact,
 * off-lattice boundary label.
 */
function niceCoveringTicks({
  rangeBounds,
  hardBounds,
  maximumCount,
}: {
  rangeBounds: Tuple<number>;
  hardBounds: Tuple<number>;
  maximumCount: number;
}): number[] {
  const hardLower = Math.min(...hardBounds);
  const hardUpper = Math.max(...hardBounds);
  const lower = Math.max(hardLower, Math.min(...rangeBounds));
  const upper = Math.min(hardUpper, Math.max(...rangeBounds));
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) return [];
  if (lower === upper) return [lower];

  const count = Math.max(2, Math.round(maximumCount));
  const idealStep = (upper - lower) / (count - 1);
  const exponent = Math.floor(Math.log10(idealStep));
  const stepCandidates = Array.from(
    new Set(
      range(-2, 5).flatMap((offset) =>
        NICE_TICK_MULTIPLIERS.map(
          (multiplier) => multiplier * 10 ** (exponent + offset)
        )
      )
    )
  ).sort((a, b) => a - b);
  const tolerance = Math.max(1, Math.abs(lower), Math.abs(upper)) * 1e-12;
  let bestFallback: number[] = [];
  let bestFallbackStepDistance = Infinity;
  let bestFallbackError = Infinity;

  for (const step of stepCandidates) {
    const minimumLegalIndex = Math.ceil((hardLower - tolerance) / step);
    const maximumLegalIndex = Math.floor((hardUpper + tolerance) / step);
    const firstIndex = Math.max(
      Math.floor((lower + tolerance) / step),
      minimumLegalIndex
    );
    const lastIndex = Math.min(
      Math.ceil((upper - tolerance) / step),
      maximumLegalIndex
    );
    const firstTick = firstIndex * step;
    const lastTick = lastIndex * step;
    const alignedCount = Math.max(0, lastIndex - firstIndex + 1);
    const coversRange =
      firstTick <= lower + tolerance && lastTick >= upper - tolerance;

    if (coversRange && alignedCount >= 2 && alignedCount <= count) {
      return range(firstIndex, lastIndex + 1).map((index) =>
        Number((index * step).toPrecision(12))
      );
    }

    const legalCount = maximumLegalIndex - minimumLegalIndex + 1;
    const fallbackCount = Math.min(count, legalCount);
    if (fallbackCount < 2) continue;

    const idealStart =
      (lower + upper - step * (fallbackCount - 1)) / (2 * step);
    const fallbackStartCandidates = Array.from(
      new Set([
        Math.floor(idealStart),
        Math.ceil(idealStart),
        Math.floor(lower / step),
        Math.ceil(upper / step) - (fallbackCount - 1),
        minimumLegalIndex,
        maximumLegalIndex - (fallbackCount - 1),
      ])
    ).map((index) =>
      Math.max(
        minimumLegalIndex,
        Math.min(maximumLegalIndex - (fallbackCount - 1), index)
      )
    );
    const fallbackStart = fallbackStartCandidates.reduce((best, candidate) => {
      const error = (index: number) =>
        Math.abs(index * step - lower) +
        Math.abs((index + fallbackCount - 1) * step - upper);
      const candidateError = error(candidate);
      const bestError = error(best);
      if (candidateError < bestError) return candidate;
      if (candidateError === bestError && candidate > best) return candidate;
      return best;
    });
    const fallback = range(fallbackStart, fallbackStart + fallbackCount).map(
      (index) => Number((index * step).toPrecision(12))
    );
    const fallbackError =
      Math.abs((fallback[0] as number) - lower) +
      Math.abs((fallback.at(-1) as number) - upper);
    const fallbackStepDistance = Math.abs(Math.log(step / idealStep));

    if (
      fallbackStepDistance < bestFallbackStepDistance ||
      (fallbackStepDistance === bestFallbackStepDistance &&
        (fallbackError < bestFallbackError ||
          (fallbackError === bestFallbackError &&
            fallback.length > bestFallback.length)))
    ) {
      bestFallback = fallback;
      bestFallbackStepDistance = fallbackStepDistance;
      bestFallbackError = fallbackError;
    }
  }

  return bestFallback.length ? bestFallback : [lower, upper];
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

type LogTick = {
  tick: number;
  displayValue: number;
};

const LOG_MAJOR_MULTIPLIERS = [1, 2, 5];
const LOG_GUARD_MULTIPLIERS = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8];
const LOG_GUARD_MAX_PADDING_RATIO = 0.08;
const LOG_COVERAGE_TOLERANCE_PX = 1;
const LOG_MIN_LABEL_SEPARATION_PX = 18;

function createLogTick(displayValue: number, scaling: Scaling): LogTick {
  return {
    tick: Number(unscaleNominalLocation(displayValue, scaling).toFixed(6)),
    displayValue: Number(displayValue.toPrecision(12)),
  };
}

function getLogTickCandidates({
  scaling,
  hardLower,
  hardUpper,
  zeroPoint,
  rangeDirection,
  multipliers,
}: {
  scaling: Scaling;
  hardLower: number;
  hardUpper: number;
  zeroPoint: number;
  rangeDirection: -1 | 1;
  multipliers: number[];
}): LogTick[] {
  const lowerDistance = Math.min(
    Math.abs(hardLower - zeroPoint),
    Math.abs(hardUpper - zeroPoint)
  );
  const upperDistance = Math.max(
    Math.abs(hardLower - zeroPoint),
    Math.abs(hardUpper - zeroPoint)
  );
  if (
    !(lowerDistance > 0) ||
    !Number.isFinite(lowerDistance) ||
    !Number.isFinite(upperDistance)
  ) {
    return [];
  }

  const firstExponent = Math.floor(Math.log10(lowerDistance)) - 1;
  const lastExponent = Math.ceil(Math.log10(upperDistance)) + 1;
  const tolerance =
    Math.max(1, Math.abs(hardLower), Math.abs(hardUpper)) * 1e-12;
  const candidatesByTick = new Map<number, LogTick>();

  for (let exponent = firstExponent; exponent <= lastExponent; exponent++) {
    multipliers.forEach((multiplier) => {
      const displayValue = Number(
        (zeroPoint + rangeDirection * multiplier * 10 ** exponent).toPrecision(
          12
        )
      );
      if (
        displayValue < hardLower - tolerance ||
        displayValue > hardUpper + tolerance
      ) {
        return;
      }

      const candidate = createLogTick(
        Math.max(hardLower, Math.min(hardUpper, displayValue)),
        scaling
      );
      if (Number.isFinite(candidate.tick)) {
        candidatesByTick.set(candidate.tick, candidate);
      }
    });
  }

  return Array.from(candidatesByTick.values()).sort((a, b) => a.tick - b.tick);
}

function getClosestLogGuard({
  side,
  coverageTick,
  coverageDisplayValue,
  hardBoundary,
  coarseCandidates,
  extendedCandidates,
  scaling,
  coverageTolerance,
  coverageSpan,
}: {
  side: "lower" | "upper";
  coverageTick: number;
  coverageDisplayValue: number;
  hardBoundary: number;
  coarseCandidates: LogTick[];
  extendedCandidates: LogTick[];
  scaling: Scaling;
  coverageTolerance: number;
  coverageSpan: number;
}): LogTick {
  const hardBoundaryTick = createLogTick(hardBoundary, scaling);
  if (Math.abs(hardBoundaryTick.tick - coverageTick) <= coverageTolerance) {
    return hardBoundaryTick;
  }

  const closestWithinTolerance = coarseCandidates
    .filter(
      (candidate) =>
        Math.abs(candidate.tick - coverageTick) <= coverageTolerance
    )
    .sort(
      (a, b) =>
        Math.abs(a.tick - coverageTick) - Math.abs(b.tick - coverageTick)
    )
    .at(0);
  if (closestWithinTolerance) return closestWithinTolerance;

  const findCoveringCandidate = (
    candidates: LogTick[],
    enforcePaddingLimit: boolean
  ) => {
    const coveringCandidates = candidates.filter((candidate) =>
      side === "lower"
        ? candidate.tick <= coverageTick
        : candidate.tick >= coverageTick
    );
    const candidate =
      side === "lower" ? coveringCandidates.at(-1) : coveringCandidates.at(0);
    if (!candidate) return undefined;

    const padding =
      side === "lower"
        ? coverageTick - candidate.tick
        : candidate.tick - coverageTick;
    return !enforcePaddingLimit ||
      padding / coverageSpan <= LOG_GUARD_MAX_PADDING_RATIO
      ? candidate
      : undefined;
  };

  const coarseGuard = findCoveringCandidate(coarseCandidates, true);
  if (coarseGuard) return coarseGuard;

  // Extended guards are denser than the canonical 1/2/5 sequence. Prefer
  // their nearest legal outward value to exposing a raw uncertainty extremum.
  const extendedGuard = findCoveringCandidate(extendedCandidates, false);
  if (extendedGuard) return extendedGuard;

  return createLogTick(coverageDisplayValue, scaling);
}

function selectLogTicksNearTargets(
  candidates: LogTick[],
  targets: number[]
): LogTick[] {
  if (targets.length > candidates.length) return [];

  const candidateCount = candidates.length;
  const parents: number[][] = [
    Array.from({ length: candidateCount }, () => -1),
  ];
  let previousCosts = candidates.map(
    (candidate) => (candidate.tick - (targets[0] as number)) ** 2
  );

  for (let targetIndex = 1; targetIndex < targets.length; targetIndex++) {
    const costs = Array.from({ length: candidateCount }, () => Infinity);
    const rowParents = Array.from({ length: candidateCount }, () => -1);
    let bestPreviousCost = Infinity;
    let bestPreviousIndex = -1;

    for (
      let candidateIndex = 0;
      candidateIndex < candidateCount;
      candidateIndex++
    ) {
      const previousIndex = candidateIndex - 1;
      if (
        previousIndex >= 0 &&
        (previousCosts[previousIndex] as number) < bestPreviousCost
      ) {
        bestPreviousCost = previousCosts[previousIndex] as number;
        bestPreviousIndex = previousIndex;
      }
      if (bestPreviousIndex < 0) continue;

      costs[candidateIndex] =
        bestPreviousCost +
        ((candidates[candidateIndex] as LogTick).tick -
          (targets[targetIndex] as number)) **
          2;
      rowParents[candidateIndex] = bestPreviousIndex;
    }

    previousCosts = costs;
    parents.push(rowParents);
  }

  let selectedIndex = previousCosts.reduce(
    (bestIndex, cost, index) =>
      cost < (previousCosts[bestIndex] as number) ? index : bestIndex,
    0
  );
  if (!Number.isFinite(previousCosts[selectedIndex])) return [];

  const selected = Array.from<LogTick>({ length: targets.length });
  for (let targetIndex = targets.length - 1; targetIndex >= 0; targetIndex--) {
    selected[targetIndex] = candidates[selectedIndex] as LogTick;
    selectedIndex = (parents[targetIndex] as number[])[selectedIndex] as number;
  }
  return selected;
}

function removeCrowdedLogTicksNearGuards(
  ticks: LogTick[],
  axisLength: number
): LogTick[] {
  const selected = ticks.slice();
  while (selected.length > 2) {
    const gaps = selected
      .slice(1)
      .map((tick, index) => tick.tick - (selected[index] as LogTick).tick);
    const sortedGaps = gaps.slice().sort((a, b) => a - b);
    const middle = Math.floor(sortedGaps.length / 2);
    const medianGap =
      sortedGaps.length % 2
        ? (sortedGaps[middle] as number)
        : ((sortedGaps[middle - 1] as number) +
            (sortedGaps[middle] as number)) /
          2;
    const visualSpan =
      (selected.at(-1) as LogTick).tick - (selected[0] as LogTick).tick;
    const minimumSeparation = Math.max(
      medianGap * 0.6,
      (LOG_MIN_LABEL_SEPARATION_PX / Math.max(axisLength, 1)) * visualSpan
    );
    const lowerGap = gaps[0] as number;
    const upperGap = gaps.at(-1) as number;
    const lowerIsCrowded = lowerGap < minimumSeparation;
    const upperIsCrowded = upperGap < minimumSeparation;

    if (!lowerIsCrowded && !upperIsCrowded) break;
    if (lowerIsCrowded && (!upperIsCrowded || lowerGap <= upperGap)) {
      selected.splice(1, 1);
    } else {
      selected.splice(-2, 1);
    }
  }
  return selected;
}

/**
 * Pins legal ticks around the plotted extrema, then optimizes canonical 1/2/5
 * ticks between them for visual spacing and approximate count.
 */
function getVisuallySpacedLogTicks({
  zoomedDomain,
  scaling,
  rangeBounds,
  coverageRange,
  tickCount,
  zeroPoint,
  axisLength,
}: {
  zoomedDomain: Tuple<number>;
  scaling: Scaling;
  rangeBounds: Tuple<number>;
  coverageRange?: Tuple<number>;
  tickCount: number;
  zeroPoint: number;
  axisLength: number;
}): LogTick[] {
  const visualStart = Math.min(...zoomedDomain);
  const visualStop = Math.max(...zoomedDomain);
  const hardLower = Math.min(...rangeBounds);
  const hardUpper = Math.max(...rangeBounds);
  const count = Math.max(2, Math.round(tickCount));
  const rangeDirection =
    hardLower >= zeroPoint ? 1 : hardUpper <= zeroPoint ? -1 : 0;

  if (rangeDirection !== 0) {
    const coarseCandidates = getLogTickCandidates({
      scaling,
      hardLower,
      hardUpper,
      zeroPoint,
      rangeDirection,
      multipliers: LOG_MAJOR_MULTIPLIERS,
    });
    const extendedCandidates = getLogTickCandidates({
      scaling,
      hardLower,
      hardUpper,
      zeroPoint,
      rangeDirection,
      multipliers: LOG_GUARD_MULTIPLIERS,
    });
    const fallbackCoverageRange = [
      scaleInternalLocation(visualStart, scaling),
      scaleInternalLocation(visualStop, scaling),
    ] as Tuple<number>;
    let coverageDisplayLower = Math.max(
      hardLower,
      Math.min(hardUpper, Math.min(...(coverageRange ?? fallbackCoverageRange)))
    );
    let coverageDisplayUpper = Math.max(
      hardLower,
      Math.min(hardUpper, Math.max(...(coverageRange ?? fallbackCoverageRange)))
    );
    let coverageTickLower = createLogTick(coverageDisplayLower, scaling).tick;
    let coverageTickUpper = createLogTick(coverageDisplayUpper, scaling).tick;
    const visualSpan = Math.max(visualStop - visualStart, Number.EPSILON);
    const coverageTolerance =
      (LOG_COVERAGE_TOLERANCE_PX / Math.max(axisLength, 1)) * visualSpan;

    // A flat series still gets the chart's small safety domain as its guard
    // range, instead of collapsing both labels onto the same plotted value.
    if (coverageTickUpper - coverageTickLower <= coverageTolerance) {
      coverageDisplayLower = Math.max(
        hardLower,
        scaleInternalLocation(visualStart, scaling)
      );
      coverageDisplayUpper = Math.min(
        hardUpper,
        scaleInternalLocation(visualStop, scaling)
      );
      coverageTickLower = createLogTick(coverageDisplayLower, scaling).tick;
      coverageTickUpper = createLogTick(coverageDisplayUpper, scaling).tick;
    }

    const coverageSpan = Math.max(
      coverageTickUpper - coverageTickLower,
      visualSpan,
      Number.EPSILON
    );
    const lowerGuard = getClosestLogGuard({
      side: "lower",
      coverageTick: coverageTickLower,
      coverageDisplayValue: coverageDisplayLower,
      hardBoundary: hardLower,
      coarseCandidates,
      extendedCandidates,
      scaling,
      coverageTolerance,
      coverageSpan,
    });
    const upperGuard = getClosestLogGuard({
      side: "upper",
      coverageTick: coverageTickUpper,
      coverageDisplayValue: coverageDisplayUpper,
      hardBoundary: hardUpper,
      coarseCandidates,
      extendedCandidates,
      scaling,
      coverageTolerance,
      coverageSpan,
    });
    const interiorCandidates = extendedCandidates.filter(
      (candidate) =>
        candidate.tick > lowerGuard.tick && candidate.tick < upperGuard.tick
    );
    const selectedTickCount = Math.min(interiorCandidates.length + 2, count);
    const interiorCount = selectedTickCount - 2;
    const targets = range(1, selectedTickCount - 1).map(
      (index) =>
        lowerGuard.tick +
        (index / (selectedTickCount - 1)) * (upperGuard.tick - lowerGuard.tick)
    );
    const selectedInterior =
      interiorCount > 0
        ? selectLogTicksNearTargets(interiorCandidates, targets)
        : [];
    const selected =
      selectedInterior.length === interiorCount
        ? [lowerGuard, ...selectedInterior, upperGuard]
        : [lowerGuard, upperGuard];

    return removeCrowdedLogTicksNearGuards(selected, axisLength);
  }

  const displayStart = scaleInternalLocation(visualStart, scaling);
  const displayStop = scaleInternalLocation(visualStop, scaling);
  return fitNiceTicksWithinRange(
    niceTicksNearCount(
      Math.min(displayStart, displayStop),
      Math.max(displayStart, displayStop),
      count
    ),
    hardLower,
    hardUpper
  ).map((displayValue) => ({
    tick: Number(unscaleNominalLocation(displayValue, scaling).toFixed(6)),
    displayValue,
  }));
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

/** Keeps coverage ticks while removing interior labels until the count fits. */
function limitTicksPreservingCoverage(
  ticks: number[],
  maximumCount: number
): number[] {
  const count = Math.max(2, Math.round(maximumCount));
  const selected = ticks.slice();

  while (selected.length > count && selected.length > 2) {
    let bestRemovalIndex = 1;
    let bestGapVariance = Infinity;

    for (let index = 1; index < selected.length - 1; index++) {
      const candidate = selected.filter(
        (_, candidateIndex) => candidateIndex !== index
      );
      const gaps = candidate
        .slice(1)
        .map((tick, gapIndex) => tick - (candidate[gapIndex] as number));
      const meanGap = gaps.reduce((total, gap) => total + gap, 0) / gaps.length;
      const gapVariance =
        gaps.reduce((total, gap) => total + (gap - meanGap) ** 2, 0) /
        gaps.length;

      if (gapVariance < bestGapVariance) {
        bestGapVariance = gapVariance;
        bestRemovalIndex = index;
      }
    }

    selected.splice(bestRemovalIndex, 1);
  }

  return selected;
}

/** Adds at most the nearest generated tick beyond each side of a chart domain. */
export function widenDomainToTicks(
  domain: Tuple<number>,
  ticks: number[]
): Tuple<number> {
  const finiteTicks = ticks.filter(Number.isFinite).sort((a, b) => a - b);
  const closestLowerTick = finiteTicks
    .filter((tick) => tick < domain[0])
    .at(-1);
  const closestUpperTick = finiteTicks.find((tick) => tick > domain[1]);

  return [
    isNil(closestLowerTick) ? domain[0] : closestLowerTick,
    isNil(closestUpperTick) ? domain[1] : closestUpperTick,
  ];
}

/** Removes generated ticks that remain outside the finalized chart domain. */
export function restrictScaleTicksToDomain(
  scale: Scale,
  domain: Tuple<number>
): Scale {
  const lower = Math.min(...domain);
  const upper = Math.max(...domain);

  return {
    ...scale,
    ticks: scale.ticks.filter((tick) => tick >= lower && tick <= upper),
  };
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
      const tickCountHint = Math.min(
        MAX_NUMERIC_MAJOR_TICK_COUNT,
        forceTickCount ?? maxLabelCount
      );
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
      const coverageSpan = tickCoverageRange
        ? Math.abs(tickCoverageRange[1] - tickCoverageRange[0])
        : 0;
      const relevantRange: Tuple<number> =
        tickCoverageRange && coverageSpan > Number.EPSILON
          ? tickCoverageRange
          : [
              Math.min(zoomedRangeMin, zoomedRangeMax),
              Math.max(zoomedRangeMin, zoomedRangeMax),
            ];
      const niceMajorRangeTicks =
        displayType === QuestionType.Numeric
          ? niceCoveringTicks({
              rangeBounds: relevantRange,
              hardBounds: [rangeMin, rangeMax],
              maximumCount: tickCountHint,
            })
          : limitTicksPreservingCoverage(
              addGuardTicksToCoverRange(
                fitNiceTicksWithinRange(
                  niceTicksNearCount(
                    Math.min(zoomedRangeMin, zoomedRangeMax),
                    Math.max(zoomedRangeMin, zoomedRangeMax),
                    tickCountHint
                  ),
                  rangeMin,
                  rangeMax
                ),
                tickCoverageRange,
                [Math.min(rangeMin, rangeMax), Math.max(rangeMin, rangeMax)]
              ),
              tickCountHint
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
    const tickCountHint = Math.min(
      MAX_NUMERIC_MAJOR_TICK_COUNT,
      forceTickCount ?? maxLabelCount
    );
    const logTicks = getVisuallySpacedLogTicks({
      zoomedDomain: [zoomedDomainMin, zoomedDomainMax],
      scaling: rangeScaling,
      rangeBounds: [rangeMin, rangeMax],
      coverageRange: tickCoverageRange,
      tickCount: tickCountHint,
      zeroPoint,
      axisLength,
    });
    majorTicks = logTicks.map(({ tick, displayValue }) => {
      niceDisplayValuesByTick.set(tick, displayValue);
      return tick;
    });

    const minorTicksPerMajorInterval = forceTickCount
      ? 1
      : direction === "horizontal"
        ? 10
        : 3;
    minorTicks = majorTicks.slice();
    range(0, majorTicks.length - 1).forEach((i) => {
      const previousTick = majorTicks.at(i) ?? 0;
      const nextTick = majorTicks.at(i + 1) ?? 1;
      const step = (nextTick - previousTick) / minorTicksPerMajorInterval;
      for (let j = 1; j < minorTicksPerMajorInterval; j++) {
        minorTicks.push(previousTick + j * step);
      }
    });
    minorTicks.sort((a, b) => a - b);
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
