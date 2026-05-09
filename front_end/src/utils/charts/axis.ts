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
  const fontSizeScale = yLabel ? 11 : 9;
  return {
    rightPadding:
      Math.round((longestLabelLength * labelsFontSize * fontSizeScale) / 10) +
      SCATTER_POINT_PADDING,
    MIN_RIGHT_PADDING: 35,
  };
}

type GenerateYDomainParams = {
  minValues: Array<{ timestamp: number; y: number | null | undefined }>;
  maxValues: Array<{ timestamp: number; y: number | null | undefined }>;
  minTimestamp: number;
  zoom: TimelineChartZoomOption;
  isChartEmpty: boolean;
  zoomDomainPadding?: number;
  includeClosestBoundOnZoom?: boolean;
  forceAutoZoom?: boolean;
  useFullYDomain?: boolean;
};

export function generateTimeSeriesYDomain({
  zoom,
  isChartEmpty,
  minValues,
  maxValues,
  minTimestamp,
  zoomDomainPadding,
  includeClosestBoundOnZoom,
  forceAutoZoom,
  useFullYDomain,
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
    useFullYDomain || timestamp >= minTimestamp;

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
    includeClosestBoundOnZoom,
  });
}

export function generateYDomain({
  minValue,
  maxValue,
  zoomDomainPadding = 0.05,
  includeClosestBoundOnZoom = false,
}: {
  minValue: number;
  maxValue: number;
  zoomDomainPadding?: number;
  includeClosestBoundOnZoom?: boolean;
}): YDomain {
  const originalYDomain: Tuple<number> = [0, 1];

  let zoomedYDomain: Tuple<number> = [0, 1];
  const distanceToZero = Math.abs(minValue - zoomDomainPadding);
  const distanceToOne = Math.abs(1 - (maxValue + zoomDomainPadding));

  if (includeClosestBoundOnZoom) {
    if (distanceToZero === distanceToOne) {
      zoomedYDomain = [0, 1];
    } else {
      // Include the closer bound
      zoomedYDomain =
        distanceToZero < distanceToOne
          ? [0, Math.min(1, maxValue + zoomDomainPadding)]
          : [Number(Math.max(0, minValue - zoomDomainPadding).toFixed(8)), 1];
    }
  } else {
    zoomedYDomain = [
      Number(Math.max(0, minValue - zoomDomainPadding).toFixed(8)),
      Math.min(1, maxValue + zoomDomainPadding),
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

/**
 * Like d3.ticks, but treats the count as a ceiling instead of a hint.
 * d3.ticks picks the nicest step size and returns however many ticks
 * fit — which can exceed the requested count and overflow tight axes.
 * Walking down from maxCount until the result fits guarantees count
 * <= maxCount while preserving the {1,2,5} * 10^k step guarantee.
 */
function niceTicksAtMost(
  start: number,
  stop: number,
  maxCount: number
): number[] {
  for (let c = Math.max(1, maxCount); c >= 1; c--) {
    const t = d3.ticks(start, stop, c);
    if (t.length >= 2 && t.length <= maxCount) return t;
  }
  // No c produced a count in [2, maxCount] — typically because the nice
  // step sizes near maxCount land us at 1 tick on one side and >maxCount
  // on the other. Try counts up to the global cap (4) looking for any
  // nice result with at least 2 ticks; better to slightly exceed the
  // local cap than fall back to ugly raw endpoints.
  for (let c = 1; c <= 4; c++) {
    const t = d3.ticks(start, stop, c);
    if (t.length >= 2 && t.length <= 4) return t;
  }
  return start === stop ? [start] : [start, stop];
}

/**
 * Returns a domain that contains both the original data domain and every
 * tick in the supplied array. Use to widen Victory's yDomain so that
 * generateScale's tick labels actually land inside the chart's drawing
 * area — important for log-warped questions where the data clusters in
 * a small slice and the auto-zoomed yDomain would otherwise clip ticks.
 */
export function widenDomainToTicks(
  domain: Tuple<number>,
  ticks: number[]
): Tuple<number> {
  if (ticks.length === 0) return domain;
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
    // get last label width to determine the number of labels
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
    maxLabelCount = Math.min(
      lastLabel.length ? axisLength / (12 * lastLabel.length) : 15,
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
  } else if (
    displayType === QuestionType.Discrete &&
    direction === "vertical"
  ) {
    // expect to have a forced tick count, and never include
    // out of bounds values
    const tickCount = forceTickCount
      ? Math.min(forceTickCount, inbound_outcome_count)
      : inbound_outcome_count;

    const halfBucket = 0.5 / inbound_outcome_count;
    const tickStart = halfBucket;
    const tickEnd = 1 - halfBucket;

    minorTicks = range(0, tickCount).map((i) => {
      // round to the nearest outcome value
      const x =
        Math.round((i / (tickCount - 1)) * (inbound_outcome_count - 1)) /
        (inbound_outcome_count - 1);
      return (
        Math.round((tickStart + (tickEnd - tickStart) * x) * 1000000) / 1000000
      );
    });

    const step =
      Math.max(1, Math.ceil((tickCount - 2) / maxLabelCount)) / tickCount;
    majorTicks = range(tickStart, tickEnd - 0.6 * step, step).map(
      (x) => Math.round(x * 1000000) / 1000000
    );
    majorTicks.push(minorTicks.at(-1) ?? 1);
  } else if (isNil(zeroPoint)) {
    // Linear Scaling
    if (displayType === QuestionType.Numeric) {
      // Pick mathematically "nice" ticks (multiples of {1,2,5} * 10^k) in
      // the actual data range, then map them back to domain coordinates.
      // Doing this in range space matters when domain is normalized [0, 1]
      // but the data range is something like [-27.7, 20]: nice values in
      // domain space unscale to ugly display values, so we have to compute
      // niceness against the values users will see.
      // forceTickCount, when supplied, is treated as a hint to d3.ticks();
      // the resulting count may differ by ±1-2 in exchange for nicer values.
      const tickCountHint = Math.min(4, forceTickCount ?? maxLabelCount);
      const zoomedRangeMin = scaleInternalLocation(
        unscaleNominalLocation(zoomedDomainMin, domainScaling),
        rangeScaling
      );
      const zoomedRangeMax = scaleInternalLocation(
        unscaleNominalLocation(zoomedDomainMax, domainScaling),
        rangeScaling
      );

      const niceMajorRangeTicks = niceTicksAtMost(
        zoomedRangeMin,
        zoomedRangeMax,
        tickCountHint
      );
      const rangeToDomain = (v: number) =>
        scaleInternalLocation(
          unscaleNominalLocation(v, rangeScaling),
          domainScaling
        );
      majorTicks = niceMajorRangeTicks.map(
        (v) => Math.round(rangeToDomain(v) * 1000000) / 1000000
      );

      // Minor tick density is based on the major step in range units, not
      // an absolute tick position.
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
        .map((v) => Math.round(rangeToDomain(v) * 1000000) / 1000000);
      // Major ticks must always be a subset of minor — otherwise their
      // labels get filtered out at render time (tickFormat checks major
      // membership). The d3.ticks count for minor can lock onto a step
      // that doesn't include the major positions, so merge explicitly.
      minorTicks = Array.from(new Set([...majorTicks, ...denseMinor])).sort(
        (a, b) => a - b
      );
    } else if (forceTickCount) {
      // Non-numeric linear scales (e.g. date axes) need exact, evenly-spaced
      // ticks across the zoomed domain — d3.ticks would produce ugly raw
      // timestamps. Clamp count to >= 2 to avoid divide-by-zero.
      const count = Math.max(2, forceTickCount);
      const evenlySpaced = range(0, count).map(
        (i) =>
          Math.round(
            (zoomedDomainMin +
              (i / (count - 1)) * (zoomedDomainMax - zoomedDomainMin)) *
              1000000
          ) / 1000000
      );
      majorTicks = evenlySpaced;
      minorTicks = evenlySpaced.slice();
    } else {
      const count = Math.max(2, maxLabelCount);
      const evenlySpaced = range(0, count).map(
        (i) =>
          Math.round(
            (zoomedDomainMin +
              (i / (count - 1)) * (zoomedDomainMax - zoomedDomainMin)) *
              1000000
          ) / 1000000
      );
      majorTicks = evenlySpaced;
      minorTicks = evenlySpaced.slice();
    }
  } else {
    // Logarithmic Scaling
    // Pick nice round numbers in display (range) space, then unscale each
    // back to domain coordinates so they land at the right positions on
    // the warped axis. The previous approach picked evenly-spaced warped
    // positions and rounded them to fewest sig figs, but kept the
    // endpoints verbatim — which produced ugly labels like 52.7.
    const tickCountHint = Math.min(4, forceTickCount ?? maxLabelCount);
    const displayMin = scaleInternalLocation(zoomedDomainMin, rangeScaling);
    const displayMax = scaleInternalLocation(zoomedDomainMax, rangeScaling);
    const niceMajorRangeTicks = niceTicksAtMost(
      Math.min(displayMin, displayMax),
      Math.max(displayMin, displayMax),
      tickCountHint
    );

    majorTicks = niceMajorRangeTicks.map(
      (x) =>
        Math.round(unscaleNominalLocation(x, rangeScaling) * 1000000) / 1000000
    );

    // Minor ticks subdivide each major interval evenly in display space,
    // then unscale to domain — that's what makes the gridlines appear
    // logarithmically spaced and showcases the warp.
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
      if (displayType === QuestionType.Discrete) {
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
    // alwaysShowTicks tells the chart to label every tick value verbatim
    // (it bypasses the major/minor filter in tickFormat). Returning the
    // major array honors the cap-of-4 in that case; returning the dense
    // minor array would let callers like group_chart blow past the cap.
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
