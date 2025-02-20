import { AggregationMethod } from "@/types/question";

import { AggregationMethodWithBots, AggregationOption } from "./types";

export const AGGREGATION_EXPLORER_OPTIONS: readonly [
  AggregationOption,
  ...AggregationOption[],
] = [
  {
    id: AggregationMethodWithBots.recency_weighted,
    value: AggregationMethod.recency_weighted,
    label: "Recency-weighted median (no bots)",
    includeBots: false,
  },
  {
    id: AggregationMethodWithBots.unweighted,
    value: AggregationMethod.unweighted,
    label: "Unweighted median (no bots)",
    includeBots: false,
  },
  {
    id: AggregationMethodWithBots.single_aggregation,
    value: AggregationMethod.single_aggregation,
    label: "Single aggregation (no bots)",
    includeBots: false,
    isStaffOnly: true,
  },
  {
    id: AggregationMethodWithBots.metaculus_prediction,
    value: AggregationMethod.metaculus_prediction,
    label: "Metaculus prediction",
    includeBots: false,
  },
  {
    id: AggregationMethodWithBots.recency_weighted_bot,
    value: AggregationMethod.recency_weighted,
    label: "Recency-weighted median (with bots)",
    includeBots: true,
  },
  {
    id: AggregationMethodWithBots.unweighted_bot,
    value: AggregationMethod.unweighted,
    label: "Unweighted median (with bots)",
    includeBots: true,
  },
  {
    id: AggregationMethodWithBots.single_aggregation_bot,
    value: AggregationMethod.single_aggregation,
    label: "Single aggregation (with bots)",
    includeBots: true,
    isStaffOnly: true,
  },
];
