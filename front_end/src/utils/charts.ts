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
import { QuestionStatus, Resolution } from "@/types/post";
import {
  QuestionType,
  QuestionWithNumericForecasts,
  Question,
  QuestionWithMultipleChoiceForecasts,
  UserForecastHistory,
  Scaling,
  AggregateForecast,
  AggregationQuestion,
  Aggregations,
  QuestionWithForecasts,
  AggregateForecastHistory,
} from "@/types/question";
import { computeQuartilesFromCDF } from "@/utils/math";
import { abbreviatedNumber } from "@/utils/number_formatters";
import { formatResolution, isUnsuccessfullyResolved } from "@/utils/questions";

import {
  getForecastDateDisplayValue,
  getForecastNumericDisplayValue,
  getForecastPctDisplayValue,
} from "./forecasts";

export function getContinuousChartTypeFromQuestion(
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
  const validTimestamps = uniq(timestamps.filter((t) => t !== null));
  const latestTimestamp = validTimestamps.at(-1);
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
      startDate = fromUnixTime(Math.min(...validTimestamps));
  }

  return [
    Math.max(Math.min(...validTimestamps), getUnixTime(startDate)),
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
  value: number | null,
  questionType: QuestionType,
  precision?: number,
  truncation?: number
): string {
  if (value === null) {
    return "...";
  }
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
  precision,
  truncation,
  range,
}: {
  value: number | null | undefined;
  questionType: QuestionType;
  scaling: Scaling;
  precision?: number;
  truncation?: number;
  range?: number[];
}): string {
  if (value === undefined || value === null) {
    return "...";
  }
  const scaledValue = scaleInternalLocation(value, scaling);
  const centerDisplay = displayValue(
    scaledValue,
    questionType,
    precision,
    truncation
  );
  if (range) {
    const scaledLower = scaleInternalLocation(range[0], scaling);
    const lowerDisplay = displayValue(
      scaledLower,
      questionType,
      precision,
      truncation
    );
    const scaledUpper = scaleInternalLocation(range[1], scaling);
    const upperDisplay = displayValue(
      scaledUpper,
      questionType,
      precision,
      truncation
    );
    return `${centerDisplay} (${lowerDisplay} - ${upperDisplay})`;
  }
  return centerDisplay;
}

export function getChoiceOptionValue(
  value: number | null,
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

export function getUserPredictionDisplayValue(
  myForecasts: UserForecastHistory,
  timestamp: number | null | undefined,
  questionType: Question | QuestionType,
  scaling?: Scaling,
  showRange?: boolean
): string {
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

  let center: number;
  let lower: number | undefined = undefined;
  let upper: number | undefined = undefined;
  if (questionType === QuestionType.Binary) {
    center = closestUserForecast.forecast_values[1];
  } else {
    center = closestUserForecast.centers![0];
    lower = showRange
      ? closestUserForecast.interval_lower_bounds![0]
      : undefined;
    upper = showRange
      ? closestUserForecast.interval_upper_bounds![0]
      : undefined;
  }
  const scaledCenter = scaleInternalLocation(
    center,
    scaling ?? { range_min: 0, range_max: 1, zero_point: null }
  );
  const scaledLower = lower
    ? scaleInternalLocation(
        lower,
        scaling ?? { range_min: 0, range_max: 1, zero_point: null }
      )
    : null;
  const scaledUpper = upper
    ? scaleInternalLocation(
        upper,
        scaling ?? { range_min: 0, range_max: 1, zero_point: null }
      )
    : null;

  if (questionType === QuestionType.Date) {
    const displayCenter = format(fromUnixTime(scaledCenter), "yyyy-MM-dd");
    if (showRange) {
      const displayLower = !!scaledLower
        ? format(fromUnixTime(scaledLower), "yyyy-MM-dd")
        : "...";
      const displayUpper = !!scaledUpper
        ? format(fromUnixTime(scaledUpper), "yyyy-MM-dd")
        : "...";
      return `${displayCenter} (${displayLower} - ${displayUpper})`;
    }
    return displayCenter;
  } else if (questionType === QuestionType.Numeric) {
    const displayCenter = abbreviatedNumber(scaledCenter);
    if (showRange) {
      const displayLower = !!scaledLower
        ? abbreviatedNumber(scaledLower)
        : "...";
      const displayUpper = !!scaledUpper
        ? abbreviatedNumber(scaledUpper)
        : "...";
      return `${displayCenter} (${displayLower} - ${displayUpper})`;
    }
    return displayCenter;
  } else {
    return `${Math.round(scaledCenter * 1000) / 10}%`;
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
          getDisplayValue({
            value: unscaled,
            questionType: displayType as QuestionType,
            scaling: rangeScaling,
            precision: 3,
          }) + displayLabel
        );
      }
      return "";
    },
    cursorFormat: (x) => {
      const unscaled = unscaleNominalLocation(x, domainScaling);
      return (
        getDisplayValue({
          value: unscaled,
          questionType: displayType as QuestionType,
          scaling: rangeScaling,
          precision: 6,
        }) + displayLabel
      );
    },
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

  const choiceOrdering: number[] = question.options!.map((_, i) => i);
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
          ? aggregationForecast.centers[index]
          : null
      );
      aggregationMinValues.push(
        !!aggregationForecast?.interval_lower_bounds
          ? aggregationForecast.interval_lower_bounds[index]
          : null
      );
      aggregationMaxValues.push(
        !!aggregationForecast?.interval_upper_bounds
          ? aggregationForecast.interval_upper_bounds[index]
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
      displayedResolution: question.resolution
        ? choice === question.resolution
          ? "Yes"
          : "No"
        : undefined,
      aggregationTimestamps: sortedAggregationTimestamps,
      aggregationValues: aggregationValues,
      aggregationMinValues: aggregationMinValues,
      aggregationMaxValues: aggregationMaxValues,
      aggregationForecasterCounts: aggregationForecasterCounts,
      userTimestamps: sortedUserTimestamps,
      userValues: userValues,
    };
  });
  // reorder choice items
  const orderedChoiceItems = choiceOrdering.map((order) => choiceItems[order]);
  // move resolved choice to the front
  const resolutionIndex = choiceOrdering.findIndex(
    (order) => question.options![order] === question.resolution
  );
  if (resolutionIndex !== -1) {
    const [resolutionItem] = orderedChoiceItems.splice(resolutionIndex, 1);
    orderedChoiceItems.unshift(resolutionItem);
  }
  // set inactive items
  if (activeCount) {
    orderedChoiceItems.forEach((item, index) => {
      item.active = index < activeCount;
    });
  }
  return orderedChoiceItems;
}

export function generateChoiceItemsFromAggregations(
  question: AggregationQuestion,
  config?: {
    locale?: string;
  }
): ChoiceItem[] {
  const { locale } = config ?? {};

  const choiceItems: ChoiceItem[] = [];
  const aggregations = question.aggregations;
  let index = 0;
  for (const key in aggregations) {
    const aggregationKey = key as keyof Aggregations;
    const aggregation = aggregations[aggregationKey];

    if (!aggregation?.history || !aggregation.history.length) {
      continue;
    }

    const aggregationHistory = aggregation.history;
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
    const userValues: (number | null)[] = [];
    const userMinValues: (number | null)[] = [];
    const userMaxValues: (number | null)[] = [];
    const aggregationValues: (number | null)[] = [];
    const aggregationMinValues: (number | null)[] = [];
    const aggregationMaxValues: (number | null)[] = [];
    const aggregationForecasterCounts: number[] = [];
    sortedAggregationTimestamps.forEach((timestamp) => {
      const aggregationForecast = aggregationHistory.find((forecast) => {
        return (
          forecast.start_time <= timestamp &&
          (forecast.end_time === null || forecast.end_time > timestamp)
        );
      });
      aggregationValues.push(aggregationForecast?.centers![0] || null);
      aggregationMinValues.push(
        aggregationForecast?.interval_lower_bounds![0] || null
      );
      aggregationMaxValues.push(
        aggregationForecast?.interval_upper_bounds![0] || null
      );
      aggregationForecasterCounts.push(
        aggregationForecast?.forecaster_count || 0
      );
    });
    choiceItems.push({
      id: question.id,
      choice: aggregationKey,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      highlighted: false,
      active: true,
      resolution: question.resolution,
      displayedResolution: !!question.resolution
        ? formatResolution(question.resolution, question.type, locale ?? "en")
        : null,
      closeTime: Math.min(
        new Date(question.scheduled_close_time).getTime(),
        new Date(
          question.actual_resolve_time ?? question.scheduled_resolve_time
        ).getTime()
      ),
      rangeMin: question.scaling.range_min ?? 0,
      rangeMax: question.scaling.range_min ?? 1,
      scaling: question.scaling,
      aggregationTimestamps: sortedAggregationTimestamps,
      aggregationValues: aggregationValues,
      aggregationMinValues: aggregationMinValues,
      aggregationMaxValues: aggregationMaxValues,
      aggregationForecasterCounts: aggregationForecasterCounts,
      userTimestamps: [],
      userValues: userValues,
      userMinValues:
        question.type === QuestionType.Binary ? undefined : userMinValues, // used in continuous group questions
      userMaxValues:
        question.type === QuestionType.Binary ? undefined : userMaxValues, // used in continuous group questions
    });
    index++;
  }
  return choiceItems;
}

export function generateChoiceItemsFromGroupQuestions(
  questions: QuestionWithNumericForecasts[],
  config?: {
    activeCount?: number;
    preselectedQuestionId?: number;
    locale?: string;
    preserveOrder?: boolean;
  }
): ChoiceItem[] {
  if (questions.length == 0) {
    return [];
  }
  const { activeCount, preselectedQuestionId, locale, preserveOrder } =
    config ?? {};

  const latests: (AggregateForecast | undefined)[] = questions.map(
    (question) => question.aggregations.recency_weighted.latest
  );
  const choiceOrdering: number[] = latests.map((_, i) => i);
  if (!preserveOrder) {
    choiceOrdering.sort((a, b) => {
      const aCenter = latests[a]?.centers?.[0] ?? 0;
      const bCenter = latests[b]?.centers?.[0] ?? 0;
      return bCenter - aCenter;
    });
  }
  const preselectedQuestionLabel = preselectedQuestionId
    ? questions.find((q) => q.id === preselectedQuestionId)?.label
    : undefined;

  const choiceItems: ChoiceItem[] = choiceOrdering.map((order, index) => {
    const question = questions[order];
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
        userValues.push(userForecast?.forecast_values[1] || null);
      } else {
        // continuous
        userValues.push(userForecast?.centers![0] || null);
        userMinValues.push(userForecast?.interval_lower_bounds![0] || null);
        userMaxValues.push(userForecast?.interval_upper_bounds![0] || null);
      }
    });
    sortedAggregationTimestamps.forEach((timestamp) => {
      const aggregationForecast = aggregationHistory.find((forecast) => {
        return (
          forecast.start_time <= timestamp &&
          (forecast.end_time === null || forecast.end_time > timestamp)
        );
      });
      aggregationValues.push(aggregationForecast?.centers![0] || null);
      aggregationMinValues.push(
        aggregationForecast?.interval_lower_bounds![0] || null
      );
      aggregationMaxValues.push(
        aggregationForecast?.interval_upper_bounds![0] || null
      );
      aggregationForecasterCounts.push(
        aggregationForecast?.forecaster_count || 0
      );
    });

    return {
      id: question.id,
      choice: label,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      highlighted: false,
      active: true,
      resolution: question.resolution,
      displayedResolution: !!question.resolution
        ? formatResolution(question.resolution, question.type, locale ?? "en")
        : null,
      closeTime,
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
    .map((q) => ({
      name: q.label,
      cdf: q.aggregations.recency_weighted.latest?.forecast_values ?? [],
      resolvedAt: new Date(q.scheduled_resolve_time),
      resolved: q.resolution !== null,
      question: q,
    }))
    .sort((a, b) => differenceInMilliseconds(a.resolvedAt, b.resolvedAt))
    .map(({ name, cdf, resolved, question }) => ({
      name,
      quartiles: cdf.length > 0 ? computeQuartilesFromCDF(cdf) : undefined,
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
        name: q.label,
        quartiles: !!aggregation
          ? {
              median: aggregation.centers?.[0] ?? 0,
              lower25: aggregation.interval_lower_bounds?.[0] ?? 0,
              upper75: aggregation.interval_upper_bounds?.[0] ?? 0,
            }
          : undefined,
        resolved,
        question: q,
        resolvedAt: new Date(q.scheduled_resolve_time),
      };
    })
    .sort((a, b) => differenceInMilliseconds(a.resolvedAt, b.resolvedAt));
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
  const p2 = line[i + 1] ?? line[i];

  if (!p1.y || !p2.y) return 0;

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
  return forecastIndex === -1 ? null : aggregation.history[forecastIndex];
}
