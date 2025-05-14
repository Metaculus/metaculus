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

import { Scale, TimelineChartZoomOption } from "@/types/charts";
import { QuestionType, Scaling } from "@/types/question";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { unscaleNominalLocation } from "@/utils/math";
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
  const longestLabelLength = Math.max(...labels.map((label) => label.length));
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
  const longestLabelLength = Math.max(...labels.map((label) => label.length));
  const fontSizeScale = yLabel ? 10 : 9;
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
  const tickCount = (maxLabelCount - 1) * 5 + 1;

  // TODO: this does not support choosing values intelligently in
  // real scaling. The y-axis is always a domain of 0-1 with
  // linear scaling as that is the native format for the
  // forecast data. To get this to intelligently choose ticks and
  // labels, this operation will have to be done in the real
  // scaling first, then transformed back into the domain scale.
  const zoomedRange = zoomedDomainMax - zoomedDomainMin;
  let minorRes: number;
  let majorRes: number;
  if (zoomedRange > 0.7) {
    minorRes = 0.05; // only tick on multiples of 0.05
    majorRes = 0.25; // only label on multiples of 0.25
  } else if (zoomedRange > 0.5) {
    minorRes = 0.025; // only tick on multiples of 0.025
    majorRes = 0.1; // only label on multiples of 0.10
  } else if (zoomedRange > 0.1) {
    minorRes = 0.01; // only tick on multiples of 0.01
    majorRes = 0.05; // only label on multiples of 0.05
  } else if (zoomedRange > 0.05) {
    minorRes = 0.005; // only tick on multiples of 0.005
    majorRes = 0.025; // only label on multiples of 0.025
  } else {
    minorRes = 0.0025; // only tick on multiples of 0.0025
    majorRes = 0.01; // only label on multiples of 0.01
  }

  const minorTickInterval =
    Math.max(Math.round(zoomedRange / (tickCount - 1) / minorRes), 1) *
    minorRes;

  const tickStart = Math.round(zoomedDomainMin / minorRes) * minorRes;
  const tickEnd =
    Math.round((zoomedDomainMax + minorTickInterval / 100) / minorRes) *
    minorRes *
    1.001;
  const minorTicks: number[] = range(tickStart, tickEnd, minorTickInterval).map(
    (x) => Math.round(x * 1000) / 1000
  );
  const majorTickStart = Math.round(zoomedDomainMin / majorRes) * majorRes;
  const majorTickInterval =
    Math.max(Math.round(zoomedRange / (maxLabelCount - 1) / majorRes), 1) *
    majorRes;

  const majorTicks: number[] = range(
    majorTickStart,
    tickEnd,
    majorTickInterval
  ).map((x) => Math.round(x * 1000) / 1000);

  // // Debugging - do not remove
  // console.log(
  //   "\n displayType:",
  //   displayType,
  //   "\n axisLength:",
  //   axisLength,
  //   "\n domain:",
  //   domain,
  //   "\n zoomedDomain:",
  //   zoomedDomain,
  //   "\n zoomedRange:",
  //   zoomedRange,
  //   "\n scaling:",
  //   scaling,
  //   "\n unit:",
  //   unit,
  //   "\n maxLabelCount:",
  //   maxLabelCount,
  //   "\n tickCount:",
  //   tickCount,
  //   "\n domainScaling:",
  //   domainScaling,
  //   "\n rangeScaling:",
  //   rangeScaling,
  //   "\n minorRes:",
  //   minorRes,
  //   "\n majorRes:",
  //   majorRes,
  //   "\n tickStart:",
  //   tickStart,
  //   "\n tickEnd:",
  //   tickEnd,
  //   "\n minorTickInterval:",
  //   minorTickInterval,
  //   "\n minorTicks:",
  //   minorTicks,
  //   "\n majorTickInterval:",
  //   majorTickInterval,
  //   "\n majorTicks:",
  //   majorTicks
  // );

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
    if (majorTicks.includes(Math.round(x * 1000) / 1000)) {
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

  return {
    ticks: minorTicks,
    tickFormat: tickFormat,
    cursorFormat: cursorFormat,
  };
}
