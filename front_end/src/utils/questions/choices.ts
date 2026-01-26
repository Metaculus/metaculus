import { isNil, uniq } from "lodash";
import { useTranslations } from "next-intl";

import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { ChoiceItem } from "@/types/choices";
import { PostGroupOfQuestions, QuestionStatus } from "@/types/post";
import {
  QuestionType,
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { isForecastActive } from "@/utils/forecasts/helpers";
import {
  formatMultipleChoiceResolution,
  formatResolution,
} from "@/utils/formatters/resolution";
import { sortGroupPredictionOptions } from "@/utils/questions/groupOrdering";
import {
  getAllOptionsHistory,
  getUpcomingOptions,
} from "@/utils/questions/helpers";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

export function generateChoiceItemsFromMultipleChoiceForecast(
  question: QuestionWithMultipleChoiceForecasts,
  t: ReturnType<typeof useTranslations>,
  config?: {
    withMinMax?: boolean;
    activeCount?: number;
    preselectedQuestionId?: number;
    locale?: string;
    preserveOrder?: boolean;
    showNoResolutions?: boolean;
  }
): ChoiceItem[] {
  const { activeCount, preserveOrder, showNoResolutions = true } = config ?? {};

  const latest =
    question.aggregations[question.default_aggregation_method].latest;

  const allOptions = getAllOptionsHistory(question);
  const upcomingOptions = getUpcomingOptions(question);
  const choiceOrdering: number[] = allOptions?.map((_, i) => i) ?? [];
  if (!preserveOrder) {
    choiceOrdering.sort((a, b) => {
      const aCenter = latest?.forecast_values[a] ?? 0;
      const bCenter = latest?.forecast_values[b] ?? 0;
      return bCenter - aCenter;
    });
  }

  const aggregationHistory =
    question.aggregations[question.default_aggregation_method].history;
  const userHistory = question.my_forecasts?.history;

  const aggregationTimestamps: number[] = [];
  aggregationHistory.forEach((forecast) => {
    aggregationTimestamps.push(forecast.start_time);
    if (forecast.end_time && !isForecastActive(forecast)) {
      aggregationTimestamps.push(forecast.end_time);
    }
  });
  const sortedAggregationTimestamps = uniq(aggregationTimestamps).sort(
    (a, b) => a - b
  );
  const userTimestamps: number[] = [];
  userHistory?.forEach((forecast) => {
    userTimestamps.push(forecast.start_time);
    if (forecast.end_time && !isForecastActive(forecast)) {
      userTimestamps.push(forecast.end_time);
    }
  });
  const sortedUserTimestamps = uniq(userTimestamps).sort((a, b) => a - b);

  const choiceItems: ChoiceItem[] = allOptions.map((choice, index) => {
    const isDeleted = !question.options.includes(choice);
    const isUpcoming = upcomingOptions.includes(choice);
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
      label: isDeleted
        ? choice + " (" + t("deleted") + ")"
        : isUpcoming
          ? choice + " (" + t("Upcoming") + ")"
          : choice,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      highlighted: false,
      active: true,
      resolution:
        showNoResolutions ||
        question.resolution === choice ||
        isUnsuccessfullyResolved(question.resolution)
          ? question.resolution
          : null,
      displayedResolution: !!question.resolution
        ? formatMultipleChoiceResolution(
            question.resolution,
            choice,
            showNoResolutions
          )
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
    (order) => allOptions?.[order] === question.resolution
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

type QuestionOptionsConfig = {
  activeCount?: number;
  preselectedQuestionId?: number;
  locale?: string;
  shortBounds?: boolean;
  excludeUnit?: boolean;
  resolutionSigfigs?: number;
};

/**
 * Generate choice items from either group post or list of questions
 * Group post questions are sorting according to group configuration
 * @param data either a group post data or a list of questions
 * @param config configuration for choice items
 * @param config.activeCount number of active items
 * @param config.preselectedQuestionId id of the preselected question
 * @param config.locale locale for formatting
 * @param config.shortBounds if true, use short bounds for formatting
 */
export function generateChoiceItemsFromGroupQuestions(
  data:
    | QuestionWithNumericForecasts[]
    | PostGroupOfQuestions<QuestionWithNumericForecasts>,
  config?: QuestionOptionsConfig
): ChoiceItem[] {
  let questions: QuestionWithNumericForecasts[];
  if (Array.isArray(data)) {
    questions = data;
  } else {
    questions = sortGroupPredictionOptions(data.questions, data);
  }

  if (questions.length == 0) {
    return [];
  }
  const {
    activeCount,
    preselectedQuestionId,
    locale,
    shortBounds,
    excludeUnit,
    resolutionSigfigs,
  } = config ?? {};

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

    const aggregationHistory = question.aggregations[
      question.default_aggregation_method
    ].history.filter((forecast) => {
      return forecast.start_time * 1000 < closeTime;
    });

    const aggregationTimestamps: number[] = [];
    aggregationHistory.forEach((forecast) => {
      aggregationTimestamps.push(forecast.start_time);
      if (forecast.end_time && !isForecastActive(forecast)) {
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
      if (forecast.end_time && !isForecastActive(forecast)) {
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
            unit: excludeUnit ? undefined : question.unit,
            actual_resolve_time: question.actual_resolve_time ?? null,
            completeBounds: shortBounds,
            sigfigs: resolutionSigfigs,
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
