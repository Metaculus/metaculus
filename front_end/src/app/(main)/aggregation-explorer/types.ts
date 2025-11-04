import {
  AggregationQuestion,
  Aggregations,
  AggregateForecastHistory,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";

// flexible version of Aggregations type which can include
// arbitrarily named aggregations
export type AggregationsExtra = Aggregations &
  Partial<Record<string, AggregateForecastHistory>>;

export type AggregationExtraQuestion = AggregationQuestion & {
  aggregations: AggregationsExtra;
};

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
}

export type AggregationOption = {
  id: AggregationExtraMethod;
  value: string;
  label: string;
  includeBots: boolean;
  isStaffOnly?: boolean;
};

export type AggregationTooltip = {
  aggregationMethod: string;
  choice: AggregationExtraMethod;
  label: string;
  includeBots: boolean;
  color: ThemeColor;
};
