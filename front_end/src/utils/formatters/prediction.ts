import { format, fromUnixTime } from "date-fns";
import { isNil } from "lodash";

import { ContinuousForecastInputType } from "@/types/charts";
import {
  Question,
  QuestionType,
  Scaling,
  UserForecastHistory,
} from "@/types/question";
import { abbreviatedNumber } from "@/utils/formatters/number";
import { scaleInternalLocation } from "@/utils/math";
import { formatValueUnit, isUnitCompact } from "@/utils/questions/units";

export function getForecastPctDisplayValue(
  value: number | string | null | undefined
) {
  if (isNil(value)) {
    return "?";
  }

  return `${Math.round(Number(value) * 1000) / 10}%`;
}

export function getForecastNumericDisplayValue(
  value: number | string,
  params?: {
    precision?: number;
    unit?: string;
  }
) {
  const { precision, unit } = params ?? {};
  return formatValueUnit(abbreviatedNumber(value, precision), unit);
}

export function getForecastDateDisplayValue(
  value: number,
  params?: {
    scaling?: Scaling;
    actual_resolve_time?: string | null;
    dateFormatString?: string;
    adjustLabels?: boolean;
  }
) {
  const { scaling, actual_resolve_time, dateFormatString, adjustLabels } =
    params ?? {};

  if (dateFormatString) {
    return format(fromUnixTime(value), dateFormatString);
  }

  const dateFormat = scaling
    ? getQuestionDateFormatString({
        scaling,
        actual_resolve_time,
        valueTimestamp: value,
        includeRefTime: adjustLabels,
      })
    : "d MMM yyyy";

  return format(fromUnixTime(value), dateFormat);
}

function formatPredictionDisplayValue(
  value: number,
  {
    questionType,
    actual_resolve_time,
    precision,
    scaling,
    dateFormatString,
    unit,
    adjustLabels = false,
  }: {
    questionType: QuestionType;
    actual_resolve_time: string | null;
    precision?: number;
    scaling?: Scaling;
    truncation?: number;
    dateFormatString?: string;
    unit?: string;
    adjustLabels?: boolean;
  }
): string {
  precision = precision ?? 3;
  if (questionType === QuestionType.Date) {
    return getForecastDateDisplayValue(value, {
      dateFormatString,
      actual_resolve_time,
      scaling,
      adjustLabels,
    });
  } else if (questionType === QuestionType.Numeric) {
    return getForecastNumericDisplayValue(value, { precision, unit });
  } else {
    return getForecastPctDisplayValue(value);
  }
}

function checkQuartilesOutOfBorders(
  quartile: number | undefined,
  options?: { longBounds?: boolean }
) {
  const { longBounds = false } = options ?? {};

  if (longBounds) {
    return quartile === 0 ? "Less than " : quartile === 1 ? "More than " : "";
  }

  return quartile === 0 ? "<" : quartile === 1 ? ">" : "";
}

type PredictionDisplayValueParams = {
  questionType: QuestionType;
  scaling?: Scaling;
  actual_resolve_time: string | null;
  precision?: number;
  range?: number[];
  dateFormatString?: string;
  unit?: string;
  adjustLabels?: boolean;
  skipQuartilesBorders?: boolean; // remove "<" or ">" from the formatted value if the value is out of the quartiles
  longBounds?: boolean;
  emptyLabel?: string;
};

function displayValue(
  value: number | null | undefined,
  {
    questionType,
    scaling,
    actual_resolve_time,
    precision,
    dateFormatString,
    unit,
    adjustLabels = false,
    skipQuartilesBorders = false,
    longBounds = false,
    emptyLabel = "...",
  }: Omit<PredictionDisplayValueParams, "range">
) {
  if (isNil(value)) {
    return emptyLabel;
  }

  const scaledValue = scaling ? scaleInternalLocation(value, scaling) : value;
  const prefix = skipQuartilesBorders
    ? ""
    : checkQuartilesOutOfBorders(value, {
        longBounds,
      });

  return (
    prefix +
    formatPredictionDisplayValue(scaledValue, {
      questionType,
      precision,
      scaling,
      actual_resolve_time,
      dateFormatString,
      unit,
      adjustLabels,
    })
  );
}

/**
 * Returns the display value of an internal location given the
 * details of the question
 */
export function getPredictionDisplayValue(
  value: number | null | undefined,
  params: PredictionDisplayValueParams
): string {
  const { range, ...displayValueParams } = params;
  const { emptyLabel = "..." } = displayValueParams;

  if (isNil(value)) {
    return emptyLabel;
  }

  const centerDisplay = displayValue(value, displayValueParams);

  if (range) {
    const lowerX = range[0];
    const upperX = range[1];
    if (isNil(lowerX) || isNil(upperX)) {
      return emptyLabel;
    }

    const lowerDisplay = displayValue(lowerX, displayValueParams);
    const upperDisplay = displayValue(upperX, displayValueParams);

    return `${centerDisplay} \n(${lowerDisplay} - ${upperDisplay})`;
  }

  return centerDisplay;
}

export function getTableDisplayValue(
  value: number | null | undefined,
  {
    questionType,
    actual_resolve_time,
    scaling,
    precision,
    range,
    forecastInputMode = ContinuousForecastInputType.Slider,
    unit,
  }: {
    questionType: QuestionType;
    actual_resolve_time: string | null;
    scaling: Scaling;
    precision?: number;
    range?: number[];
    forecastInputMode?: ContinuousForecastInputType;
    unit?: string;
  }
) {
  if (isNil(value)) {
    return "...";
  }

  if (forecastInputMode === ContinuousForecastInputType.Quantile) {
    return formatPredictionDisplayValue(value, {
      questionType,
      scaling,
      actual_resolve_time,
      precision,
    });
  }

  const formatted_value = getPredictionDisplayValue(value, {
    questionType,
    scaling,
    actual_resolve_time,
    precision,
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
  actual_resolve_time: string | null | undefined;
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
    const displayCenter = getPredictionDisplayValue(center, {
      questionType,
      scaling: scaling ?? { range_min: 0, range_max: 1, zero_point: null },
      actual_resolve_time,
    });
    if (showRange) {
      const displayLower = !isNil(lower)
        ? getPredictionDisplayValue(lower, {
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
        ? getPredictionDisplayValue(upper, {
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
  } else if (questionType === QuestionType.Numeric) {
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
