import { uniq } from "lodash";

import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { ChoiceItem } from "@/types/choices";
import { AggregationsExtra, QuestionType } from "@/types/question";
import { CurrentUser } from "@/types/users";
import { formatResolution } from "@/utils/formatters/resolution";

import { AGGREGATION_EXPLORER_OPTIONS } from "./constants";
import {
  AggregationMethodWithBots,
  AggregationExtraQuestion,
  AggregationTooltip,
} from "./types";

export function generateAggregationTooltips(
  user: CurrentUser | null
): AggregationTooltip[] {
  const order: AggregationMethodWithBots[] = user?.is_superuser
    ? [
        AggregationMethodWithBots.recency_weighted,
        AggregationMethodWithBots.unweighted,
        AggregationMethodWithBots.single_aggregation,
        AggregationMethodWithBots.recency_weighted_bot,
        AggregationMethodWithBots.unweighted_bot,
        AggregationMethodWithBots.single_aggregation_bot,
        AggregationMethodWithBots.metaculus_prediction,
        AggregationMethodWithBots.metaculus_pros,
        AggregationMethodWithBots.medalists,
        AggregationMethodWithBots.silver_medalists,
        AggregationMethodWithBots.gold_medalists,
      ]
    : [
        AggregationMethodWithBots.recency_weighted,
        AggregationMethodWithBots.unweighted,
        AggregationMethodWithBots.single_aggregation,
        AggregationMethodWithBots.metaculus_prediction,
        AggregationMethodWithBots.recency_weighted_bot,
        AggregationMethodWithBots.unweighted_bot,
        AggregationMethodWithBots.single_aggregation_bot,
        AggregationMethodWithBots.metaculus_pros,
        AggregationMethodWithBots.medalists,
        AggregationMethodWithBots.silver_medalists,
        AggregationMethodWithBots.gold_medalists,
      ];

  return [...AGGREGATION_EXPLORER_OPTIONS]
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    .map((AggregationOption, index) => {
      if (AggregationOption.isStaffOnly && (!user || !user.is_staff)) {
        return null;
      }
      return {
        aggregationMethod: AggregationOption.value,
        choice: AggregationOption.id,
        label: AggregationOption.label,
        includeBots: AggregationOption.includeBots,
        color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      };
    })
    .filter((tooltip) => tooltip !== null) as AggregationTooltip[];
}

export function generateChoiceItemsFromAggregations({
  question,
  selectedSubQuestionOption,
  tooltips,
  locale,
}: {
  question: AggregationExtraQuestion;
  selectedSubQuestionOption: number | string | null;
  tooltips: AggregationTooltip[];
  locale?: string;
}): ChoiceItem[] {
  const choiceItems: ChoiceItem[] = [];
  const aggregations = question.aggregations;
  parseAggregationData({
    aggregations,
    choiceItems,
    question,
    locale,
    tooltips,
    selectedSubQuestionOption,
  });
  return choiceItems;
}

function parseAggregationData({
  aggregations,
  choiceItems,
  question,
  locale,
  isBot,
  tooltips,
  selectedSubQuestionOption,
}: {
  aggregations: AggregationsExtra;
  choiceItems: ChoiceItem[];
  question: AggregationExtraQuestion;
  locale?: string;
  isBot?: boolean;
  tooltips: AggregationTooltip[];
  selectedSubQuestionOption: number | string | null;
}) {
  for (const [key, aggregation] of Object.entries(aggregations)) {
    if (!aggregation) continue;
    const tooltip = tooltips.find((tooltip) => tooltip.choice == key);

    if (!aggregation?.history) {
      continue;
    } else if (!aggregation.history.length) {
      choiceItems.push({
        id: question.id,
        choice: tooltip?.choice ?? "",
        color: tooltip?.color ?? METAC_COLORS.gray["400"],
        highlighted: false,
        active: true,
        resolution: question.resolution,
        displayedResolution: !!question.resolution
          ? formatResolution({
              resolution: question.resolution,
              questionType: question.type,
              locale: locale ?? "en",
              scaling: question.scaling,
              unit: question.unit,
              actual_resolve_time: question.actual_resolve_time,
            })
          : null,
        closeTime: Math.min(
          new Date(question.scheduled_close_time).getTime(),
          new Date(
            question.actual_resolve_time ?? question.scheduled_resolve_time
          ).getTime()
        ),
        unit: question.unit,
        rangeMin: question.scaling.range_min ?? 0,
        rangeMax: question.scaling.range_min ?? 1,
        scaling: question.scaling,
        aggregationTimestamps: [],
        aggregationValues: [],
        aggregationMinValues: [],
        aggregationMaxValues: [],
        aggregationForecasterCounts: [],
        userTimestamps: [],
        userValues: [],
      });
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

    let optionIndex = 0;
    if (question.options && typeof selectedSubQuestionOption === "string") {
      const indexCandidate = question.options.findIndex(
        (o) => o === selectedSubQuestionOption
      );
      optionIndex = indexCandidate === -1 ? 0 : indexCandidate;
    }

    sortedAggregationTimestamps.forEach((timestamp) => {
      const aggregationForecast = aggregationHistory.find((forecast) => {
        return (
          forecast.start_time <= timestamp &&
          (forecast.end_time === null || forecast.end_time > timestamp)
        );
      });

      aggregationValues.push(
        aggregationForecast?.centers?.[optionIndex] || null
      );
      aggregationMinValues.push(
        aggregationForecast?.interval_lower_bounds?.[optionIndex] || null
      );
      aggregationMaxValues.push(
        aggregationForecast?.interval_upper_bounds?.[optionIndex] || null
      );
      aggregationForecasterCounts.push(
        aggregationForecast?.forecaster_count || 0
      );
    });

    choiceItems.push({
      id: question.id,
      choice: tooltip?.choice ?? "",
      color: tooltip?.color ?? METAC_COLORS.gray["400"],
      highlighted: false,
      active: true,
      resolution: question.resolution,
      displayedResolution: !!question.resolution
        ? formatResolution({
            resolution: question.resolution,
            questionType: question.type,
            locale: locale ?? "en",
            scaling: question.scaling,
            unit: question.unit,
            actual_resolve_time: question.actual_resolve_time,
          })
        : null,
      closeTime: Math.min(
        new Date(question.scheduled_close_time).getTime(),
        new Date(
          question.actual_resolve_time ?? question.scheduled_resolve_time
        ).getTime()
      ),
      unit: question.unit,
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
  }
}
