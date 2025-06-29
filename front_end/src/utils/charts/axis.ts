import * as d3 from "d3";
import {
  differenceInMilliseconds,
  fromUnixTime,
  getUnixTime,
  subDays,
  subMonths,
} from "date-fns";
import { isNil, min, range, uniq } from "lodash";
import { Tuple, VictoryThemeDefinition } from "victory";

import { Scale, TimelineChartZoomOption, YDomain } from "@/types/charts";
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
  const labels = yScale.ticks.map((tick) => yScale.tickFormat(tick));
  const longestLabelLength = Math.min(
    Math.max(...labels.map((label) => label.length)),
    12
  );
  const fontSizeScale = yLabel ? 11 : 9;
  return {
    rightPadding: Math.round(
      (longestLabelLength * labelsFontSize * fontSizeScale) / 10
    ),
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
}: GenerateYDomainParams): YDomain {
  const originalYDomain: Tuple<number> = [0, 1];
  const fallback = { originalYDomain, zoomedYDomain: originalYDomain };

  if (
    (zoom === TimelineChartZoomOption.All && !forceAutoZoom) ||
    isChartEmpty
  ) {
    return fallback;
  }

  const min = minValues
    .filter((d) => d.timestamp >= minTimestamp)
    .map((d) => d.y)
    .filter((value) => !isNil(value));
  const minValue = min.length ? Math.min(...min) : null;
  const max = maxValues
    .filter((d) => d.timestamp >= minTimestamp)
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
          : [Math.max(0, minValue - zoomDomainPadding), 1];
    }
  } else {
    zoomedYDomain = [
      Math.max(0, minValue - zoomDomainPadding),
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

/**
 * Takes an array of values and rounds them to the minimum
 * number of significant digits such that no two values
 * are rounded to the same value.
 * Values must be sorted in ascending order.
 */
function minimumSignificantRounding(values: number[]): number[] {
  const roundedValues: number[] = [];
  function sigfigRound(val: number, sigfigs: number): number {
    const divisor = 10 ** (sigfigs - Math.floor(Math.log10(Math.abs(val))) - 1);
    return Math.round(val * divisor) / divisor;
  }
  values.forEach((value, i) => {
    if (i === 0 || i === values.length - 1) {
      roundedValues.push(value);
    } else {
      const prevValue = values[i - 1];
      const nextValue = values[i + 1];
      let digits = 1;
      let candidate: number;
      while (true) {
        candidate = sigfigRound(value, digits);
        if (
          candidate - prevValue > 0.8 * (value - prevValue) &&
          sigfigRound(nextValue, digits) - candidate >=
            0.9 * (nextValue - value)
        ) {
          break;
        }
        digits += 1;
      }
      roundedValues.push(candidate);
    }
  });
  return roundedValues;
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
  let bestTickCount = maxTicks;
  let bestAvgDigits = Infinity;
  for (let i = maxTicks; i >= minTicks; i--) {
    const tickInterval = (rangeMax - rangeMin) / (i - 1);
    const tickValues = range(0, i).map((j) => rangeMin + j * tickInterval);
    const roundedValues = minimumSignificantRounding(tickValues);
    const significantDigits = roundedValues.map(
      (val) => Math.floor(Math.log10(Math.abs(val))) + 1
    );
    const avgDigits =
      significantDigits.reduce((sum, digits) => sum + digits, 0) / i;
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
  direction?: "horizontal" | "vertical";
  domain?: Tuple<number>;
  zoomedDomain?: Tuple<number>;
  scaling?: Scaling | null;
  unit?: string;
  forcedTickCount?: number;
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
  direction = "horizontal",
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
  // determine the number of ticks to label
  // based on the axis length and direction
  let maxLabelCount: number;
  if (displayType === QuestionType.Discrete && direction === "horizontal") {
    maxLabelCount = Math.min(33, inbound_outcome_count + 2);
  } else if (axisLength < 100) {
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

  let majorTicks: number[] = [];
  let minorTicks: number[] = [];
  if (displayType === QuestionType.Discrete) {
    // Discrete Scaling
    // Try and label as many ticks as possible
    // Ticks line up with the middle of the buckets
    const tickCount =
      forceTickCount ??
      inbound_outcome_count +
        (question?.open_lower_bound ? 1 : 0) +
        (question?.open_upper_bound ? 1 : 0);

    const bucketCount = tickCount - 2;
    const halfBucket = 0.5 / bucketCount;
    const tickStart = question?.open_lower_bound ? -halfBucket : halfBucket;
    const tickEnd = 1 + (question?.open_upper_bound ? halfBucket : -halfBucket);

    minorTicks = range(tickStart, tickEnd + 1e-4, 1 / bucketCount).map(
      (x) => Math.round(x * 10000) / 10000
    );

    const step =
      Math.max(1, Math.ceil((tickCount - 2) / maxLabelCount)) / bucketCount;
    majorTicks = range(tickStart, tickEnd - 0.6 * step, step).map(
      (x) => Math.round(x * 10000) / 10000
    );
    majorTicks.push(minorTicks.at(-1) ?? 1);
  } else if (isNil(zeroPoint)) {
    // Linear Scaling
    // Typical scaling, evenly spaced ticks
    // choose optimal tick count to minimize the number
    // of significant digits in the tick labels
    const majorTickCount = forceTickCount
      ? forceTickCount
      : findOptimalTickCount(
          rangeMin,
          rangeMax,
          Math.ceil(maxLabelCount / 2),
          maxLabelCount
        );
    majorTicks = range(0, majorTickCount).map(
      (i) =>
        Math.round(
          (zoomedDomainMin +
            (i / (majorTickCount - 1)) * (zoomedDomainMax - zoomedDomainMin)) *
            10000
        ) / 10000
    );
    const minorTicksPerMajor = findOptimalTickCount(
      rangeMin,
      rangeMin + (rangeMax - rangeMin) * (majorTicks[1] ?? 1 / majorTickCount),
      direction === "horizontal" ? 4 : 2,
      direction === "horizontal" ? 10 : 5
    );
    const minorTickCount = forceTickCount
      ? forceTickCount
      : (majorTickCount - 1) * minorTicksPerMajor;
    minorTicks = range(0, minorTickCount + 1).map(
      (i) =>
        Math.round(
          (zoomedDomainMin +
            (i / minorTickCount) * (zoomedDomainMax - zoomedDomainMin)) *
            10000
        ) / 10000
    );
  } else {
    // Logarithmic Scaling
    // Labeled ticks are not spaced evenly, but rather rounded to the nearby
    // values that have the fewest significant digits
    // Then, minor ticks are spaced evenly in real space, showcasing the
    // strength of the logarithmic scaling
    const tickCount = forceTickCount
      ? forceTickCount
      : (maxLabelCount - 1) * (direction === "horizontal" ? 10 : 3) + 1;
    const unscaledTargets = Array.from(
      { length: maxLabelCount },
      (_, i) =>
        zoomedDomainMin +
        ((zoomedDomainMax - zoomedDomainMin) * (i * 1)) / (maxLabelCount - 1)
    );
    const scaledTargets = unscaledTargets.map((x) =>
      scaleInternalLocation(x, rangeScaling)
    );
    const roundedScaledTargets = minimumSignificantRounding(scaledTargets);
    majorTicks = roundedScaledTargets.map(
      (x) => Math.round(unscaleNominalLocation(x, rangeScaling) * 10000) / 10000
    );

    const minorTicksPerMajorInterval = (tickCount - 1) / (maxLabelCount - 1);
    minorTicks = majorTicks.map((x) => x);
    // Logarithmic Scaling
    range(0, roundedScaledTargets.length - 1).forEach((i) => {
      const prevMajor = roundedScaledTargets.at(i) ?? 0;
      const nextMajor = roundedScaledTargets.at(i + 1) ?? 1;
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

  function tickFormat(x: number, idx?: number) {
    if (alwaysShowTicks || majorTicks.includes(Math.round(x * 10000) / 10000)) {
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

  // if (direction === "horizontal") {
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
    ticks: minorTicks,
    tickFormat: tickFormat,
    cursorFormat: cursorFormat,
  };
}
