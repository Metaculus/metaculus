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

export enum AggregationExtraMethod {
  recency_weighted = "recency_weighted",
  recency_weighted_bot = "recency_weighted_bot",
  unweighted = "unweighted",
  unweighted_bot = "unweighted_bot",
  single_aggregation = "single_aggregation",
  single_aggregation_bot = "single_aggregation_bot",
  metaculus_prediction = "metaculus_prediction",
  metaculus_prediction_bot = "metaculus_prediction_bot",
  metaculus_pros = "metaculus_pros",
  medalists = "medalists",
  silver_medalists = "silver_medalists",
  gold_medalists = "gold_medalists",
  joined_before_date = "joined_before_date",
  joined_before_date_bot = "joined_before_date_bot",
}

export type AggregationOption = {
  id: AggregationExtraMethod;
  value: string;
  label: string;
  isStaffOnly?: boolean;
  supportsBotToggle?: boolean; // user can opt-in bots via SelectedAggregationConfig.includeBots
  supportsUserIds?: boolean; // user_ids pre-filter applicable
};

export type AggregationTooltip = {
  aggregationMethod: string;
  choice: AggregationExtraMethod;
  label: string;
  includeBots: boolean;
  color: ThemeColor;
};
