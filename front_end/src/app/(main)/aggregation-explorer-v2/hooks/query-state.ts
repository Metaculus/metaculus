"use client";

import {
  createParser,
  parseAsInteger,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useRef } from "react";

import { ContinuousAreaGraphType } from "@/types/charts";

import { AggregationExtraMethod } from "../types";
import { SelectedAggregationConfig, buildConfigId } from "./aggregation-data";

export type QuerySource = "url" | "form" | null;

export function useAggregationExplorerQueryState() {
  const [searchParams, setSearchParams] = useQueryStates({
    post_id: parseAsInteger,
    question_id: parseAsInteger,
  });

  const formHasSetSelectionRef = useRef(false);

  const setSelection = (
    postId: number,
    questionId: number | null,
    options?: { fromForm?: boolean }
  ) => {
    if (options?.fromForm) {
      formHasSetSelectionRef.current = true;
    }
    return setSearchParams(
      {
        post_id: postId,
        question_id: questionId,
      },
      { history: "push" }
    );
  };

  const postId = searchParams.post_id;
  const questionSource: QuerySource =
    postId == null ? null : formHasSetSelectionRef.current ? "form" : "url";

  return {
    postId,
    questionId: searchParams.question_id,
    setSelection,
    /** Whether current querystring came from page load (direct URL) or in-page form submit. */
    querySource: questionSource,
  };
}

// ---------------------------------------------------------------------------
// Selected aggregation configs URL state
// Format: pipe-separated config IDs, "~" prefix means disabled.
// Each config ID follows buildConfigId format: optionId[:bots][:YYYY-MM-DD][:uN,N]
// Example: recency_weighted|~unweighted:bots|joined_before_date:2024-01-01
// ---------------------------------------------------------------------------

function parseConfigSpec(spec: string): SelectedAggregationConfig | null {
  const disabled = spec.startsWith("~");
  const id = disabled ? spec.slice(1) : spec;
  if (!id) return null;

  const parts = id.split(":");
  const optionId = parts[0] as AggregationExtraMethod;
  if (!optionId) return null;

  const includeBots = parts.includes("bots");
  const joinedBeforeDate = parts.find((p) => /^\d{4}-\d{2}-\d{2}$/.test(p));
  const userIdsStr = parts.find((p) => /^u\d/.test(p));
  const userIds = userIdsStr
    ? userIdsStr
        .slice(1)
        .split(",")
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0)
    : undefined;

  return {
    id,
    optionId,
    includeBots: includeBots || undefined,
    joinedBeforeDate,
    userIds: userIds?.length ? userIds : undefined,
    enabled: disabled ? false : undefined,
  };
}

const parseAsConfigs = createParser<SelectedAggregationConfig[]>({
  parse(queryValue) {
    if (!queryValue) return null;
    const configs = queryValue.split("|").flatMap((spec) => {
      const config = parseConfigSpec(spec);
      return config ? [config] : [];
    });
    return configs.length > 0 ? configs : null;
  },
  serialize(configs) {
    return configs
      .map((c) => (c.enabled === false ? "~" : "") + c.id)
      .join("|");
  },
});

const DEFAULT_CONFIGS: SelectedAggregationConfig[] = [
  {
    id: buildConfigId(AggregationExtraMethod.recency_weighted, false),
    optionId: AggregationExtraMethod.recency_weighted,
  },
  {
    id: buildConfigId(AggregationExtraMethod.unweighted, false),
    optionId: AggregationExtraMethod.unweighted,
  },
];

export { DEFAULT_CONFIGS as DEFAULT_AGGREGATION_CONFIGS };

// ---------------------------------------------------------------------------
// Sub-question / MC option selection
// Values can be numeric (group/conditional question ID) or string (MC option).
// We store as a raw string and parse back on read.
// ---------------------------------------------------------------------------

const parseAsSubQuestion = createParser<string | number>({
  parse(queryValue) {
    if (!queryValue) return null;
    const asNum = Number(queryValue);
    return Number.isFinite(asNum) && String(asNum) === queryValue
      ? asNum
      : queryValue;
  },
  serialize(value) {
    return String(value);
  },
});

export function useSubQuestionState() {
  return useQueryState("sub", parseAsSubQuestion);
}

const GRAPH_TYPE_VALUES: ContinuousAreaGraphType[] = ["pmf", "cdf"];

export function useGraphTypeState() {
  return useQueryState(
    "dist",
    parseAsStringLiteral(GRAPH_TYPE_VALUES).withDefault("pmf")
  );
}

export function useSelectedConfigsState(
  defaultConfigs: SelectedAggregationConfig[] = DEFAULT_CONFIGS
) {
  return useQueryState("methods", parseAsConfigs.withDefault(defaultConfigs));
}
