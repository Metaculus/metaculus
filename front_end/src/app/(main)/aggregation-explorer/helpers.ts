import { uniq } from "lodash";

import { METAC_COLORS } from "@/constants/colors";
import { ChoiceItem } from "@/types/choices";
import { QuestionType } from "@/types/question";
import { formatResolution } from "@/utils/formatters/resolution";

import {
  AggregationExtraQuestion,
  AggregationsExtra,
  AggregationTooltip,
} from "./types";

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
  parseAggregationData({
    aggregations: question.aggregations,
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
  tooltips,
  selectedSubQuestionOption,
}: {
  aggregations: AggregationsExtra;
  choiceItems: ChoiceItem[];
  question: AggregationExtraQuestion;
  locale?: string;
  tooltips: AggregationTooltip[];
  selectedSubQuestionOption: number | string | null;
}) {
  for (const [key, aggregation] of Object.entries(aggregations)) {
    if (!aggregation) continue;
    const tooltip = tooltips.find((t) => t.choice == key);

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
        aggregationForecast?.centers?.[optionIndex] ?? null
      );
      aggregationMinValues.push(
        aggregationForecast?.interval_lower_bounds?.[optionIndex] ?? null
      );
      aggregationMaxValues.push(
        aggregationForecast?.interval_upper_bounds?.[optionIndex] ?? null
      );
      aggregationForecasterCounts.push(
        aggregationForecast?.forecaster_count || 0
      );
    });

    // Filter out timestamps where the center value is null
    // (e.g. legacy metaculus_prediction data without centers populated)
    const validIndices = aggregationValues.reduce<number[]>((acc, v, i) => {
      if (v !== null) acc.push(i);
      return acc;
    }, []);
    const filteredTimestamps = validIndices.map(
      (i) => sortedAggregationTimestamps[i] ?? 0
    );
    const filteredValues = validIndices.map(
      (i) => aggregationValues[i] ?? null
    );
    const filteredMinValues = validIndices.map(
      (i) => aggregationMinValues[i] ?? null
    );
    const filteredMaxValues = validIndices.map(
      (i) => aggregationMaxValues[i] ?? null
    );
    const filteredForecasterCounts = validIndices.map(
      (i) => aggregationForecasterCounts[i] ?? 0
    );

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
      aggregationTimestamps: filteredTimestamps,
      aggregationValues: filteredValues,
      aggregationMinValues: filteredMinValues,
      aggregationMaxValues: filteredMaxValues,
      aggregationForecasterCounts: filteredForecasterCounts,
      userTimestamps: [],
      userValues: userValues,
      userMinValues:
        question.type === QuestionType.Binary ? undefined : userMinValues,
      userMaxValues:
        question.type === QuestionType.Binary ? undefined : userMaxValues,
    });
  }
}
