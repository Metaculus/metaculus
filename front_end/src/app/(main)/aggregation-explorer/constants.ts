import { AggregationMethod } from "@/types/question";

import { AggregationExtraMethod, AggregationOption } from "./types";

export const AGGREGATION_EXPLORER_OPTIONS: readonly [
  AggregationOption,
  ...AggregationOption[],
] = [
  {
    id: AggregationExtraMethod.recency_weighted,
    value: AggregationMethod.recency_weighted,
    label: "Recency-weighted median (no bots)",
    includeBots: false,
  },
  {
    id: AggregationExtraMethod.unweighted,
    value: AggregationMethod.unweighted,
    label: "Unweighted median (no bots)",
    includeBots: false,
  },
  {
    id: AggregationExtraMethod.single_aggregation,
    value: AggregationMethod.single_aggregation,
    label: "Single aggregation (no bots)",
    includeBots: false,
    isStaffOnly: true,
  },
  {
    id: AggregationExtraMethod.metaculus_prediction,
    value: AggregationMethod.metaculus_prediction,
    label: "Metaculus prediction",
    includeBots: false,
  },
  {
    id: AggregationExtraMethod.recency_weighted_bot,
    value: AggregationMethod.recency_weighted,
    label: "Recency-weighted median (with bots)",
    includeBots: true,
  },
  {
    id: AggregationExtraMethod.unweighted_bot,
    value: AggregationMethod.unweighted,
    label: "Unweighted median (with bots)",
    includeBots: true,
  },
  {
    id: AggregationExtraMethod.single_aggregation_bot,
    value: AggregationMethod.single_aggregation,
    label: "Single aggregation (with bots)",
    includeBots: true,
    isStaffOnly: true,
  },
  {
    id: AggregationExtraMethod.metaculus_pros,
    value: AggregationExtraMethod.metaculus_pros,
    label: "Metaculus Pros",
    includeBots: true,
  },
  {
    id: AggregationExtraMethod.medalists,
    value: AggregationExtraMethod.medalists,
    label: "Medalists (all)",
    includeBots: true,
  },
  {
    id: AggregationExtraMethod.silver_medalists,
    value: AggregationExtraMethod.silver_medalists,
    label: "Medalists (silver or gold)",
    includeBots: true,
  },
  {
    id: AggregationExtraMethod.gold_medalists,
    value: AggregationExtraMethod.gold_medalists,
    label: "Medalists (gold)",
    includeBots: true,
  },
  {
    id: AggregationExtraMethod.joined_before_date,
    value: AggregationExtraMethod.joined_before_date,
    label: "Only Users Who Joined Before Date (set in Advanced options)",
    includeBots: true,
  },
];
