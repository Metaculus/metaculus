"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import GroupChart from "@/components/charts/group_chart";
import ButtonGroup from "@/components/ui/button_group";
import { METAC_COLORS } from "@/constants/colors";
import {
  ContinuousAreaGraphType,
  TickFormat,
  TimelineChartZoomOption,
} from "@/types/charts";
import { QuestionType } from "@/types/question";
import { getPostDrivenTime } from "@/utils/questions/helpers";

import DistributionCard from "./distribution_card";
import EmptyGraphState from "./empty_graph_state";
import { generateChoiceItemsFromAggregations } from "../helpers";
import { AggregationQueryResult } from "../hooks/aggregation-data";
import { useGraphTypeState } from "../hooks/query-state";
import {
  AggregationExtraMethod,
  AggregationExtraQuestion,
  AggregationTooltip,
} from "../types";

type Props = {
  methods: AggregationQueryResult[];
  mergedData: AggregationExtraQuestion | null;
  isAnyPending: boolean;
  hasAnyError: boolean;
  hoveredId: string | null;
  onHoverOption?: (id: string | null) => void;
  colorById: Map<string, AggregationTooltip["color"]>;
  selectedSubQuestionOption: string | number | null;
  optionIndex: number;
};

const NUMERIC_TYPES = new Set([
  QuestionType.Numeric,
  QuestionType.Discrete,
  QuestionType.Date,
]);

export default function AggregationGraphPanel({
  methods,
  mergedData,
  isAnyPending,
  hasAnyError,
  hoveredId,
  onHoverOption,
  colorById,
  selectedSubQuestionOption,
  optionIndex,
}: Props) {
  const t = useTranslations();
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
  const [graphType, setGraphType] = useGraphTypeState();

  const handleCursorChange = useCallback(
    (value: number, _format: TickFormat) => {
      setCursorTimestamp(value);
    },
    []
  );

  if (!methods.length || !mergedData) {
    if (!methods.length) {
      return (
        <EmptyGraphState
          variant="empty"
          message="Select at least one aggregation from the side panel."
        />
      );
    }
    if (isAnyPending) {
      return (
        <EmptyGraphState
          variant="loading"
          message="Loading selected aggregation data..."
        />
      );
    }
    return (
      <EmptyGraphState
        variant="error"
        message="Failed to load aggregation data for selected methods."
      />
    );
  }

  const tooltips: AggregationTooltip[] = methods.map((method) => ({
    aggregationMethod: method.method,
    choice: method.id as unknown as AggregationExtraMethod,
    label: method.label,
    includeBots: method.includeBots,
    color: colorById.get(method.id) ?? METAC_COLORS.gray["400"],
  }));

  const choiceItems = generateChoiceItemsFromAggregations({
    question: mergedData,
    selectedSubQuestionOption,
    tooltips,
  }).map((item) => ({
    ...item,
    resolution: null,
    displayedResolution: null,
    highlighted:
      hoveredId !== null &&
      item.choice === (hoveredId as unknown as AggregationExtraMethod),
  }));

  const choiceColorById = new Map(
    choiceItems.map((item) => [item.choice as unknown as string, item.color])
  );

  const actualCloseTime = getPostDrivenTime(mergedData.actual_close_time);
  const timestampSet = new Set<number>(
    choiceItems.flatMap((item) => item.aggregationTimestamps ?? [])
  );
  if (actualCloseTime) {
    timestampSet.add(
      Math.min(actualCloseTime / 1000, new Date().getTime() / 1000)
    );
  } else {
    timestampSet.add(new Date().getTime() / 1000);
  }
  const timestamps = [...timestampSet].sort((a, b) => a - b);
  const effectiveChartTimestamp = cursorTimestamp ?? timestamps.at(-1) ?? null;

  const isNumericType = NUMERIC_TYPES.has(mergedData.type);
  const errorMethods = methods.filter((method) => method.isError);

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-700-dark">
        Graph
      </h2>

      <div className="rounded-md bg-white p-4 dark:border dark:border-gray-500-dark dark:bg-blue-950">
        <GroupChart
          timestamps={timestamps}
          actualCloseTime={actualCloseTime}
          choiceItems={choiceItems}
          defaultZoom={TimelineChartZoomOption.All}
          height={300}
          aggregation
          withZoomPicker
          questionType={mergedData.type}
          scaling={
            mergedData.type === QuestionType.Binary
              ? undefined
              : mergedData.scaling
          }
          onCursorChange={handleCursorChange}
          fadeLinesOnHover={hoveredId !== null}
        />
      </div>

      <div className="my-4 flex flex-row items-center justify-between gap-2">
        <h2 className="my-0 text-xs font-semibold uppercase leading-none tracking-wide text-gray-700 dark:text-gray-700-dark">
          {isNumericType ? "Distribution Views" : "Histogram Views"}
        </h2>
        {isNumericType ? (
          <ButtonGroup<ContinuousAreaGraphType>
            value={graphType}
            buttons={[
              { label: t("pdfLabel"), value: "pmf" },
              { label: t("cdfLabel"), value: "cdf" },
            ]}
            onChange={(value) => void setGraphType(value)}
            className="!px-2 !py-0.5 !text-xs"
            activeClassName="!px-2 !py-0.5 !text-xs"
          />
        ) : null}
      </div>

      <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((method) => (
          <DistributionCard
            key={method.id}
            method={method}
            mergedData={mergedData}
            cursorTimestamp={cursorTimestamp}
            effectiveChartTimestamp={effectiveChartTimestamp}
            optionIndex={optionIndex}
            graphType={graphType}
            isNumericType={isNumericType}
            choiceColor={choiceColorById.get(method.id)?.DEFAULT ?? "#9ca3af"}
            onHoverOption={onHoverOption}
          />
        ))}
      </div>

      {hasAnyError && errorMethods.length > 0 ? (
        <div className="rounded-md border border-red-300 p-3 text-sm text-red-600 dark:border-red-500/40 dark:text-red-400">
          Some methods failed:{" "}
          {errorMethods.map((method) => method.label).join(", ")}.
        </div>
      ) : null}
    </div>
  );
}
