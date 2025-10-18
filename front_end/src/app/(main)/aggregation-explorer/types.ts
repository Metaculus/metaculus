import {
  AggregationQuestion,
  AggregationsExtra,
  AggregationMethod,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";

export type AggregationExtraQuestion = AggregationQuestion & {
  aggregations: AggregationsExtra;
};

export enum AggregationMethodWithBots {
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
}

export type AggregationOption = {
  id: AggregationMethodWithBots;
  value: AggregationMethod | string;
  label: string;
  includeBots: boolean;
  isStaffOnly?: boolean;
};

export type AggregationTooltip = {
  aggregationMethod: AggregationMethod | string;
  choice: AggregationMethodWithBots;
  label: string;
  includeBots: boolean;
  color: ThemeColor;
};
