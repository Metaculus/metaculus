import { AggregationMethod, AggregationOption } from "./types";

export const AGGREGATION_EXPLORER_OPTIONS: readonly AggregationOption[] = [
  {
    id: AggregationMethod.recency_weighted,
    labelKey: "recencyWeighted",
    supportsBotToggle: true,
    supportsUserIds: true,
  },
  {
    id: AggregationMethod.joined_before_date,
    labelKey: "cohortJoinedBeforeDate",
    requiresDate: true,
    supportsBotToggle: true,
    supportsUserIds: true,
  },
  {
    id: AggregationMethod.unweighted,
    labelKey: "unweighted",
    supportsBotToggle: true,
    supportsUserIds: true,
  },
  {
    id: AggregationMethod.single_aggregation,
    labelKey: "singleAggregationLabel",
    isStaffOnly: true,
    supportsBotToggle: true,
    supportsUserIds: true,
  },
  {
    id: AggregationMethod.metaculus_prediction,
    labelKey: "metaculusPredictionLabel",
  },
  {
    id: AggregationMethod.metaculus_pros,
    labelKey: "metaculusProsLabel",
  },
  {
    id: "medalists_parent",
    labelKey: "medalists",
    childSelector: {
      labelKey: "medalTier",
      options: [
        { id: AggregationMethod.medalists, labelKey: "allMedals" },
        { id: AggregationMethod.silver_medalists, labelKey: "silverAndGold" },
        { id: AggregationMethod.gold_medalists, labelKey: "goldOnly" },
      ],
    },
  },
];

export const AGGREGATION_OPTION_BY_ID = new Map<string, AggregationOption>(
  AGGREGATION_EXPLORER_OPTIONS.flatMap((o) => {
    const entries: [string, AggregationOption][] = [[o.id, o]];
    if (o.childSelector) {
      for (const child of o.childSelector.options) {
        entries.push([child.id, child]);
      }
    }
    return entries;
  })
);

export const PARENT_OPTION_BY_CHILD_ID = new Map<string, AggregationOption>(
  AGGREGATION_EXPLORER_OPTIONS.flatMap(
    (o) =>
      o.childSelector?.options.map((child): [string, AggregationOption] => [
        child.id,
        o,
      ]) ?? []
  )
);
