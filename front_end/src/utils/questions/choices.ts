import { isNil, uniq } from "lodash";
import { useTranslations } from "next-intl";

import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { getEffectiveVisibleCount } from "@/constants/questions";
import { ChoiceItem } from "@/types/choices";
import { PostGroupOfQuestions, QuestionStatus } from "@/types/post";
import {
  MultipleChoiceOptionsOrder,
  QuestionType,
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
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

function collectSortedTimestamps(
  history: Array<{ start_time: number; end_time: number | null }>,
  baseTimestamps: number[] = []
): number[] {
  const timestamps: number[] = [...baseTimestamps];
  history.forEach((forecast) => {
    timestamps.push(forecast.start_time);
    if (forecast.end_time && forecast.end_time * 1000 <= Date.now()) {
      timestamps.push(forecast.end_time);
    }
  });
  return uniq(timestamps).sort((a, b) => a - b);
}

export function buildChoicesWithOthers(
  choices: ChoiceItem[],
  othersLabel: string = "Others"
): ChoiceItem[] {
  const active = choices.filter((c) => c.active);
  const inactive = choices.filter((c) => !c.active);
  if (inactive.length === 0) return active;

  const aggTs = inactive[0]?.aggregationTimestamps ?? [];
  const userTs = inactive[0]?.userTimestamps ?? [];

  const sumNullable = (vals: Array<number | null | undefined>) => {
    let sum = 0;
    let hasAny = false;
    for (const v of vals) {
      if (v != null) {
        sum += v;
        hasAny = true;
      }
    }
    return hasAny ? Number(sum.toFixed(6)) : null;
  };

  const aggregationValues = aggTs.map((_, i) =>
    sumNullable(inactive.map((o) => o.aggregationValues[i]))
  );
  const userValues = userTs.map((_, i) =>
    sumNullable(inactive.map((o) => o.userValues[i]))
  );

  const othersItem: ChoiceItem = {
    choice: othersLabel,
    color: METAC_COLORS.gray["400"],
    active: true,
    highlighted: false,
    resolution: null,
    displayedResolution: null,
    aggregationTimestamps: aggTs,
    aggregationValues,
    aggregationMinValues: [],
    aggregationMaxValues: [],
    aggregationForecasterCounts: [],
    userTimestamps: userTs,
    userValues,
    actual_resolve_time: null,
  };

  return [...active, othersItem];
}

export function generateChoiceItemsFromMultipleChoiceForecast(
  question: QuestionWithMultipleChoiceForecasts,
  t: ReturnType<typeof useTranslations>,
  config?: {
    withMinMax?: boolean;
    activeCount?: number;
    preselectedQuestionId?: number;
    locale?: string;
    hideCP?: boolean;
    cpRevealsOn?: string | null;
    showNoResolutions?: boolean;
  }
): ChoiceItem[] {
  const {
    activeCount,
    hideCP,
    cpRevealsOn,
    showNoResolutions = true,
  } = config ?? {};

  const latest =
    question.aggregations[question.default_aggregation_method].latest;

  const allOptions = getAllOptionsHistory(question);
  const upcomingOptions = getUpcomingOptions(question);

  const aggregationHistory =
    question.aggregations[question.default_aggregation_method].history;
  const userHistory = question.my_forecasts?.history;

  const sortedAggregationTimestamps =
    collectSortedTimestamps(aggregationHistory);
  const sortedUserTimestamps = collectSortedTimestamps(userHistory ?? []);

  // Build choice items in definition order (colors assigned by definition index)
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

  const isCPHidden = !!hideCP || !!cpRevealsOn;
  const needsActiveLimit = activeCount && activeCount < choiceItems.length;
  const effectiveActiveCount = needsActiveLimit
    ? getEffectiveVisibleCount(allOptions.length, activeCount)
    : choiceItems.length;

  // Mode 1: CP hidden → definition order, first N active
  if (isCPHidden) {
    if (needsActiveLimit) {
      choiceItems.forEach((item, idx) => {
        item.active = idx < effectiveActiveCount;
      });
    }
    return choiceItems;
  }

  // Mode 2: CP visible + CP_DESC order → sort by CP desc, first N active
  if (question.options_order === MultipleChoiceOptionsOrder.CP_DESC) {
    const cpOrder = choiceItems
      .map((item, i) => ({ item, defIndex: i }))
      .sort(
        (a, b) =>
          (latest?.forecast_values[b.defIndex] ?? 0) -
          (latest?.forecast_values[a.defIndex] ?? 0)
      )
      .map(({ item }) => item);
    if (needsActiveLimit) {
      cpOrder.forEach((item, idx) => {
        item.active = idx < effectiveActiveCount;
      });
    }
    return cpOrder;
  }

  // Mode 3: CP visible + default order → top N by CP active, reordered active-first
  if (needsActiveLimit) {
    const cpSortedIndices = choiceItems
      .map((_, i) => i)
      .sort(
        (a, b) =>
          (latest?.forecast_values[b] ?? 0) - (latest?.forecast_values[a] ?? 0)
      );
    const activeSet = new Set(cpSortedIndices.slice(0, effectiveActiveCount));
    choiceItems.forEach((item, idx) => {
      item.active = activeSet.has(idx);
    });
    const active = choiceItems.filter((item) => item.active);
    const inactive = choiceItems.filter((item) => !item.active);
    return [...active, ...inactive];
  }
  return choiceItems;
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

    const sortedAggregationTimestamps = collectSortedTimestamps(
      aggregationHistory,
      question.status === QuestionStatus.RESOLVED ||
        question.status === QuestionStatus.CLOSED
        ? [closeTime / 1000]
        : []
    );

    const sortedUserTimestamps = collectSortedTimestamps(userHistory ?? []);

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
    const effectiveActiveCount = getEffectiveVisibleCount(
      questions.length,
      activeCount
    );
    choiceItems.forEach((item, index) => {
      if (preselectedQuestionLabel) {
        item.active = preselectedQuestionLabel === item.choice;
      } else {
        item.active = index < effectiveActiveCount;
      }
    });
  }
  return choiceItems;
}
