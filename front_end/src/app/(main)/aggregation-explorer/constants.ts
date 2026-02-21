import { AggregationMethod } from "@/types/question";

import { AggregationExtraMethod, AggregationOption } from "./types";

export const AGGREGATION_EXPLORER_OPTIONS: readonly AggregationOption[] = [
  {
    id: AggregationExtraMethod.recency_weighted,
    value: AggregationMethod.recency_weighted,
    label: "Recency-weighted median",
    supportsBotToggle: true,
    supportsUserIds: true,
  },
  {
    id: AggregationExtraMethod.joined_before_date,
    value: AggregationExtraMethod.joined_before_date,
    label: "Recency weighted (joined before date)",
    supportsBotToggle: true,
    supportsUserIds: true,
  },
  {
    id: AggregationExtraMethod.unweighted,
    value: AggregationMethod.unweighted,
    label: "Unweighted median",
    supportsBotToggle: true,
    supportsUserIds: true,
  },
  {
    id: AggregationExtraMethod.single_aggregation,
    value: AggregationMethod.single_aggregation,
    label: "Single aggregation",
    isStaffOnly: true,
    supportsBotToggle: true,
    supportsUserIds: true,
  },
  {
    id: AggregationExtraMethod.metaculus_prediction,
    value: AggregationMethod.metaculus_prediction,
    label: "Metaculus prediction",
  },
  {
    id: AggregationExtraMethod.metaculus_pros,
    value: AggregationExtraMethod.metaculus_pros,
    label: "Metaculus Pros",
  },
  {
    id: AggregationExtraMethod.medalists,
    value: AggregationExtraMethod.medalists,
    label: "Medalists (all medals)",
  },
  {
    id: AggregationExtraMethod.silver_medalists,
    value: AggregationExtraMethod.silver_medalists,
    label: "Medalists (silver and gold)",
  },
  {
    id: AggregationExtraMethod.gold_medalists,
    value: AggregationExtraMethod.gold_medalists,
    label: "Medalists (gold only)",
  },
];
