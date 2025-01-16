import { AggregationMethod } from "@/types/question";

import { AggregationMethodWithBots, AggregationOption } from "./types";

export const AGGREGATION_METHOD_LABELS = {
  recency_weighted: "Recency-weighted median",
  recency_weighted_bot: "Recency-weighted median with bots",
  unweighted: "Unweighted median",
  unweighted_bot: "Unweighted median with bots",
  single_aggregation: "Single aggregation",
  single_aggregation_bot: "Single aggregation with bots",
  metaculus_prediction: "Metaculus prediction",
  metaculus_prediction_bot: "Metaculus prediction with bots",
};

export const AGGREGATION_EXPLORER_OPTIONS: readonly [
  AggregationOption,
  ...AggregationOption[],
] = [
  {
    id: AggregationMethodWithBots.recency_weighted,
    value: AggregationMethod.recency_weighted,
    label: AGGREGATION_METHOD_LABELS.recency_weighted,
    includeBots: false,
  },
  {
    id: AggregationMethodWithBots.recency_weighted_bot,
    value: AggregationMethod.recency_weighted,
    label: AGGREGATION_METHOD_LABELS.recency_weighted_bot,
    includeBots: true,
  },
  {
    id: AggregationMethodWithBots.unweighted,
    value: AggregationMethod.unweighted,
    label: AGGREGATION_METHOD_LABELS.unweighted,
    includeBots: false,
  },
  {
    id: AggregationMethodWithBots.unweighted_bot,
    value: AggregationMethod.unweighted,
    label: AGGREGATION_METHOD_LABELS.unweighted_bot,
    includeBots: true,
  },
  {
    id: AggregationMethodWithBots.single_aggregation,
    value: AggregationMethod.single_aggregation,
    label: AGGREGATION_METHOD_LABELS.single_aggregation,
    includeBots: false,
  },
  {
    id: AggregationMethodWithBots.single_aggregation_bot,
    value: AggregationMethod.single_aggregation,
    label: AGGREGATION_METHOD_LABELS.single_aggregation_bot,
    includeBots: true,
  },
  {
    id: AggregationMethodWithBots.metaculus_prediction,
    value: AggregationMethod.metaculus_prediction,
    label: AGGREGATION_METHOD_LABELS.metaculus_prediction,
    includeBots: false,
  },
  {
    id: AggregationMethodWithBots.metaculus_prediction_bot,
    value: AggregationMethod.metaculus_prediction,
    label: AGGREGATION_METHOD_LABELS.metaculus_prediction_bot,
    includeBots: true,
  },
];
