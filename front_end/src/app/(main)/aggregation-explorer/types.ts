import {
  AggregationQuestion,
  Aggregations,
  AggregationMethod,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";

export type AggregationQuestionWithBots = AggregationQuestion & {
  bot_aggregations?: Aggregations;
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
}

export type AggregationOption = {
  id: AggregationMethodWithBots;
  value: AggregationMethod;
  label: string;
  includeBots: boolean;
  isStaffOnly?: boolean;
};

export type AggregationTooltip = {
  aggregationMethod: AggregationMethod;
  choice: AggregationMethodWithBots;
  label: string;
  includeBots: boolean;
  color: ThemeColor;
};
