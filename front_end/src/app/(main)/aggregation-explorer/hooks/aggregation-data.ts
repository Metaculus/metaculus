"use client";

import { useQueries } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import ClientAggregationExplorerApi from "@/services/api/aggregation_explorer/aggregation_explorer.client";

import {
  AGGREGATION_OPTION_BY_ID,
  PARENT_OPTION_BY_CHILD_ID,
} from "../constants";
import {
  AggregationExtraQuestion,
  AggregationMethod,
  AggregationOption,
} from "../types";

type TranslateFunction = ReturnType<typeof useTranslations>;

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
  if (userIds?.length)
    parts.push(`u${[...userIds].sort((a, b) => a - b).join(",")}`);
  return parts.join(":");
}

export type SelectedAggregationConfig = {
  id: string; // unique composite key — use buildConfigId to generate
  optionId: AggregationMethod;
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
  method: string; // option.id, used for API response lookup
  includeBots: boolean;
  joinedBeforeDate?: string;
  userIds?: number[];
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
  t: TranslateFunction,
  option: AggregationOption,
  config: Pick<
    SelectedAggregationConfig,
    "joinedBeforeDate" | "userIds" | "includeBots" | "optionId"
  >
): string {
  let label =
    option.id === AggregationMethod.joined_before_date &&
    config.joinedBeforeDate
      ? t("usersJoinedBefore", { date: config.joinedBeforeDate })
      : t(option.labelKey as Parameters<TranslateFunction>[0]);

  if (option.supportsBotToggle && config.includeBots) {
    label += ` (${t("withBots")})`;
  }

  if (option.supportsUserIds && config.userIds?.length) {
    label += ` [${t("usersFilterLabel", { ids: config.userIds.join(", ") })}]`;
  }

  return label;
}

export function buildBaseLabel(
  t: TranslateFunction,
  option: AggregationOption
): string {
  const tKey = (key: string) => t(key as Parameters<TranslateFunction>[0]);
  const label = tKey(option.labelKey);
  const parent = PARENT_OPTION_BY_CHILD_ID.get(option.id);
  return parent ? `${tKey(parent.labelKey)} (${label})` : label;
}

export function buildChips(
  t: TranslateFunction,
  config: Pick<
    SelectedAggregationConfig,
    "joinedBeforeDate" | "userIds" | "includeBots"
  >
): string[] {
  const chips: string[] = [];
  if (config.joinedBeforeDate)
    chips.push(t("beforeDate", { date: config.joinedBeforeDate }));
  if (config.includeBots) chips.push(t("withBots"));
  if (config.userIds?.length)
    chips.push(t("usersFilterLabel", { ids: config.userIds.join(", ") }));
  return chips;
}

export function useAggregationData({
  postId,
  questionId,
  selectedConfigs,
}: Props) {
  const t = useTranslations();

  const selectedOptions = useMemo(
    () =>
      selectedConfigs.flatMap((config) => {
        const option = AGGREGATION_OPTION_BY_ID.get(config.optionId);
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
          aggregationMethods: option.id,
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
          option.id as keyof typeof query.data.aggregations
        ] as { history?: unknown[] } | undefined;
        const isNoData = query.isSuccess && !aggData?.history?.length;

        return {
          id: config.id,
          label: buildDisplayLabel(t, option, config),
          baseLabel: buildBaseLabel(t, option),
          chips: buildChips(t, config),
          method: option.id,
          includeBots: !!config.includeBots,
          joinedBeforeDate: config.joinedBeforeDate,
          userIds: config.userIds,
          isPending: query.isPending,
          isError: query.isError,
          isNoData,
          errorMessage:
            query.error instanceof Error
              ? query.error.message
              : query.isError
                ? t("failedToLoadAggregation")
                : null,
          data: query.data,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedOptions, queries, t]
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
