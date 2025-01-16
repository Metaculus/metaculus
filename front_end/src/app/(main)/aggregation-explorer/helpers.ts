import { uniq } from "lodash";

import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { ChoiceItem } from "@/types/choices";
import { Aggregations, QuestionType } from "@/types/question";
import { formatResolution } from "@/utils/questions";

import { AGGREGATION_EXPLORER_OPTIONS } from "./constants";
import { AggregationQuestionWithBots, AggregationTooltip } from "./types";

export function generateAggregationTooltips(): AggregationTooltip[] {
  return AGGREGATION_EXPLORER_OPTIONS.map((AggregationOption, index) => {
    return {
      aggregationMethod: AggregationOption.value,
      choice: AggregationOption.id,
      label: AggregationOption.label,
      includeBots: AggregationOption.includeBots,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
    };
  });
}

export function generateChoiceItemsFromAggregations(
  question: AggregationQuestionWithBots,
  tooltips: AggregationTooltip[],
  config?: {
    locale?: string;
  }
): ChoiceItem[] {
  const { locale } = config ?? {};

  const choiceItems: ChoiceItem[] = [];
  const aggregations = question.aggregations;
  const botAggregations = question.bot_aggregations;
  parseAggregationData({
    aggregations,
    choiceItems,
    question,
    locale,
    tooltips,
  });
  botAggregations &&
    parseAggregationData({
      aggregations: botAggregations,
      choiceItems,
      question,
      locale,
      isBot: true,
      tooltips,
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
}: {
  aggregations: Aggregations;
  choiceItems: ChoiceItem[];
  question: AggregationQuestionWithBots;
  locale?: string;
  isBot?: boolean;
  tooltips: AggregationTooltip[];
}) {
  for (const key in aggregations) {
    const aggregationKey = key as keyof Aggregations;
    const aggregation = aggregations[aggregationKey];
    const tooltip = tooltips.find(
      (tooltip) =>
        tooltip.aggregationMethod === aggregationKey &&
        tooltip.includeBots === !!isBot
    );

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
    sortedAggregationTimestamps.forEach((timestamp) => {
      const aggregationForecast = aggregationHistory.find((forecast) => {
        return (
          forecast.start_time <= timestamp &&
          (forecast.end_time === null || forecast.end_time > timestamp)
        );
      });
      aggregationValues.push(aggregationForecast?.centers?.[0] || null);
      aggregationMinValues.push(
        aggregationForecast?.interval_lower_bounds?.[0] || null
      );
      aggregationMaxValues.push(
        aggregationForecast?.interval_upper_bounds?.[0] || null
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
  }
}
