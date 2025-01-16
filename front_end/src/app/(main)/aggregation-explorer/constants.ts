import { AggregationMethod } from "@/types/question";

import { AggregationMethodWithBots, AggregationOption } from "./types";

export const AGGREGATION_EXPLORER_OPTIONS: readonly [
  AggregationOption,
  ...AggregationOption[],
] = [
  {
    id: AggregationMethodWithBots.recency_weighted,
    value: AggregationMethod.recency_weighted,
    label: "Recency-weighted median",
    includeBots: false,
  },
  {
    id: AggregationMethodWithBots.recency_weighted_bot,
    value: AggregationMethod.recency_weighted,
    label: "Recency-weighted median with bots",
    includeBots: true,
  },
  {
    id: AggregationMethodWithBots.unweighted,
    value: AggregationMethod.unweighted,
    label: "Unweighted median",
    includeBots: false,
  },
  {
    id: AggregationMethodWithBots.unweighted_bot,
    value: AggregationMethod.unweighted,
    label: "Unweighted median with bots",
    includeBots: true,
  },
  {
    id: AggregationMethodWithBots.single_aggregation,
    value: AggregationMethod.single_aggregation,
    label: "Single aggregation",
    includeBots: false,
  },
  {
    id: AggregationMethodWithBots.single_aggregation_bot,
    value: AggregationMethod.single_aggregation,
    label: "Single aggregation with bots",
    includeBots: true,
  },
  {
    id: AggregationMethodWithBots.metaculus_prediction,
    value: AggregationMethod.metaculus_prediction,
    label: "Metaculus prediction",
    includeBots: false,
  },
  {
    id: AggregationMethodWithBots.metaculus_prediction_bot,
    value: AggregationMethod.metaculus_prediction,
    label: "Metaculus prediction with bots",
    includeBots: true,
  },
];
