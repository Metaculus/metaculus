import {
  NumericAggregationQuestion,
  MultipleChoiceAggregationQuestion,
  NumericAggregations,
  MultipleChoiceAggregations,
  NumericAggregateForecastHistory,
  MultipleChoiceAggregateForecastHistory,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";

// flexible version of Aggregations type which can include
// arbitrarily named aggregations

export type NumericAggregationsExtra = NumericAggregations &
  Partial<Record<string, NumericAggregateForecastHistory>>;

export type NumericAggregationExtraQuestion = NumericAggregationQuestion & {
  aggregations: NumericAggregationsExtra;
};

export type MultipleChoiceAggregationsExtra = MultipleChoiceAggregations &
  Partial<Record<string, MultipleChoiceAggregateForecastHistory>>;

export type MultipleChoiceAggregationExtraQuestion =
  MultipleChoiceAggregationQuestion & {
    aggregations: MultipleChoiceAggregationsExtra;
  };

export type AggregationsExtra =
  | NumericAggregationsExtra
  | MultipleChoiceAggregationsExtra;

export type AggregationExtraQuestion =
  | NumericAggregationExtraQuestion
  | MultipleChoiceAggregationExtraQuestion;

// All aggregation methods the aggregation explorer API accepts.
// Each value is sent directly as the `aggregation_methods` query param.
export enum AggregationMethod {
  recency_weighted = "recency_weighted",
  unweighted = "unweighted",
  single_aggregation = "single_aggregation",
  metaculus_prediction = "metaculus_prediction",
  metaculus_pros = "metaculus_pros",
  medalists = "medalists",
  silver_medalists = "silver_medalists",
  gold_medalists = "gold_medalists",
  joined_before_date = "joined_before_date",
}

export type AggregationOption = {
  id: string;
  labelKey: string;
  isStaffOnly?: boolean;
  supportsBotToggle?: boolean;
  supportsUserIds?: boolean;
  requiresDate?: boolean;
  childSelector?: {
    labelKey: string;
    options: AggregationOption[];
  };
};

export type AggregationTooltip = {
  aggregationMethod: string;
  choice: string;
  label: string;
  includeBots: boolean;
  color: ThemeColor;
};
