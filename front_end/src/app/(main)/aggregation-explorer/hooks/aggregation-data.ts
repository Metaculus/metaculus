"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import ClientAggregationExplorerApi from "@/services/api/aggregation_explorer/aggregation_explorer.client";

import { AGGREGATION_EXPLORER_OPTIONS } from "../constants";
import { AggregationExtraMethod, AggregationExtraQuestion } from "../types";

export type V2AggregationOption = (typeof AGGREGATION_EXPLORER_OPTIONS)[number];
export type V2AggregationOptionId = V2AggregationOption["id"];

const OPTION_BY_ID = new Map(
  AGGREGATION_EXPLORER_OPTIONS.map((o) => [o.id, o])
);

/**
 * Builds a stable unique key for a config from all its differentiating params.
 * This key is used as the chart series identifier and list item id.
 */
export function buildConfigId(
  optionId: string,
  includeBots: boolean,
  joinedBeforeDate?: string,
  userIds?: number[]
): string {
  const parts = [optionId];
  if (includeBots) parts.push("bots");
  if (joinedBeforeDate) parts.push(joinedBeforeDate);
  if (userIds?.length) parts.push(`u${userIds.join(",")}`);
  return parts.join(":");
}

export type SelectedAggregationConfig = {
  id: string; // unique composite key — use buildConfigId to generate
  optionId: V2AggregationOptionId;
  joinedBeforeDate?: string;
  userIds?: number[];
  includeBots?: boolean;
  enabled?: boolean;
};

export type AggregationQueryResult = {
  id: string; // = config.id, used as chart series key
  label: string;
  baseLabel: string; // short mode name without filter details (for display in label component)
  chips: string[]; // filter chips derived from config (for display in label component)
  method: string; // option.value, used for API response lookup
  includeBots: boolean;
  joinedBeforeDate?: string;
  isPending: boolean;
  isError: boolean;
  isNoData: boolean; // loaded successfully but returned empty aggregation history
  errorMessage: string | null;
  data:
    | Awaited<ReturnType<typeof ClientAggregationExplorerApi.getAggregations>>
    | undefined;
};

type Props = {
  postId: number;
  questionId?: number;
  selectedConfigs: SelectedAggregationConfig[];
};

function mergeAggregationPayloads(
  methods: AggregationQueryResult[]
): AggregationExtraQuestion | null {
  const methodsWithData = methods.filter(
    (
      method
    ): method is AggregationQueryResult & { data: AggregationExtraQuestion } =>
      method.data !== undefined
  );

  const [firstMethod] = methodsWithData;
  if (!firstMethod) {
    return null;
  }

  const mergedAggregations: Record<string, unknown> = {};
  for (const method of methodsWithData) {
    const fetchedAggregation =
      method.data.aggregations?.[
        method.method as keyof typeof method.data.aggregations
      ];
    if (fetchedAggregation !== undefined && fetchedAggregation !== null) {
      mergedAggregations[method.id] = fetchedAggregation;
    }
  }

  return {
    ...firstMethod.data,
    aggregations: mergedAggregations,
  } as AggregationExtraQuestion;
}

export function buildDisplayLabel(
  option: V2AggregationOption,
  config: Pick<
    SelectedAggregationConfig,
    "joinedBeforeDate" | "userIds" | "includeBots" | "optionId"
  >
): string {
  let label =
    option.id === AggregationExtraMethod.joined_before_date &&
    config.joinedBeforeDate
      ? `Only users joined before ${config.joinedBeforeDate}`
      : option.label;

  if (option.supportsBotToggle && config.includeBots) {
    label += " (with bots)";
  }

  if (option.supportsUserIds && config.userIds?.length) {
    label += ` [users: ${config.userIds.join(", ")}]`;
  }

  return label;
}

export function buildBaseLabel(option: V2AggregationOption): string {
  return option.id === AggregationExtraMethod.joined_before_date
    ? "Recency weighted"
    : option.label;
}

export function buildChips(
  config: Pick<
    SelectedAggregationConfig,
    "joinedBeforeDate" | "userIds" | "includeBots"
  >
): string[] {
  const chips: string[] = [];
  if (config.joinedBeforeDate) chips.push(`before ${config.joinedBeforeDate}`);
  if (config.includeBots) chips.push("with bots");
  if (config.userIds?.length) chips.push(`users: ${config.userIds.join(", ")}`);
  return chips;
}

export function useAggregationData({
  postId,
  questionId,
  selectedConfigs,
}: Props) {
  const selectedOptions = useMemo(
    () =>
      selectedConfigs.flatMap((config) => {
        const option = OPTION_BY_ID.get(config.optionId);
        if (!option) return [];
        return { option, config };
      }),
    [selectedConfigs]
  );

  const queries = useQueries({
    queries: selectedOptions.map(({ option, config }) => ({
      queryKey: ["aggregation", postId, questionId ?? null, config.id],
      queryFn: async () => {
        return await ClientAggregationExplorerApi.getAggregations({
          postId,
          questionId,
          includeBots: config.includeBots,
          aggregationMethods: option.value,
          joinedBeforeDate: config.joinedBeforeDate,
          userIds: config.userIds,
        });
      },
    })),
  });

  const methods: AggregationQueryResult[] = useMemo(
    () =>
      selectedOptions.flatMap(({ option, config }, index) => {
        const query = queries[index];
        if (!query || config.enabled === false) return [];

        const aggData = query.data?.aggregations?.[
          option.value as keyof typeof query.data.aggregations
        ] as { history?: unknown[] } | undefined;
        const isNoData = query.isSuccess && !aggData?.history?.length;

        return {
          id: config.id,
          label: buildDisplayLabel(option, config),
          baseLabel: buildBaseLabel(option),
          chips: buildChips(config),
          method: option.value,
          includeBots: !!config.includeBots,
          joinedBeforeDate: config.joinedBeforeDate,
          isPending: query.isPending,
          isError: query.isError,
          isNoData,
          errorMessage:
            query.error instanceof Error
              ? query.error.message
              : query.isError
                ? "Failed to load aggregation"
                : null,
          data: query.data,
        };
      }),
    [selectedOptions, queries]
  );

  const mergedData = useMemo(
    () => mergeAggregationPayloads(methods),
    [methods]
  );

  return {
    methods,
    mergedData,
    isAnyPending: methods.some((method) => method.isPending),
    hasAnyError: methods.some((method) => method.isError),
  };
}
