"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";

import GroupChart from "@/components/charts/group_chart";
import ButtonGroup from "@/components/ui/button_group";
import { METAC_COLORS } from "@/constants/colors";
import { useBreakpoint } from "@/hooks/tailwind";
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
import { AggregationExtraQuestion, AggregationTooltip } from "../types";

type Props = {
  postId: number;
  questionTitle: string;
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
  postId,
  questionTitle,
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
  const isDesktop = useBreakpoint("md");
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
  const [graphType, setGraphType] = useGraphTypeState();
  const [isStuck, setIsStuck] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!node) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => setIsStuck(entry ? !entry.isIntersecting : false),
      { threshold: 0, rootMargin: "-48px 0px 0px 0px" }
    );
    observerRef.current.observe(node);
  }, []);

  const handleCursorChange = useCallback(
    (value: number, _format: TickFormat) => {
      setCursorTimestamp(value);
    },
    []
  );

  const tooltips = useMemo<AggregationTooltip[]>(
    () =>
      methods.map((method) => ({
        aggregationMethod: method.method,
        choice: method.id,
        label: method.label,
        includeBots: method.includeBots,
        color: colorById.get(method.id) ?? METAC_COLORS.gray["400"],
      })),
    [methods, colorById]
  );

  const baseChoiceItems = useMemo(() => {
    if (!mergedData) return [];
    return generateChoiceItemsFromAggregations({
      question: mergedData,
      selectedSubQuestionOption,
      tooltips,
    }).map((item) => ({
      ...item,
      resolution: null,
      displayedResolution: null,
    }));
  }, [mergedData, selectedSubQuestionOption, tooltips]);

  const timestamps = useMemo(() => {
    if (!mergedData) return [];
    const actualCloseTime = getPostDrivenTime(mergedData.actual_close_time);
    const timestampSet = new Set<number>(
      baseChoiceItems.flatMap((item) => item.aggregationTimestamps ?? [])
    );
    if (actualCloseTime) {
      timestampSet.add(
        Math.min(actualCloseTime / 1000, new Date().getTime() / 1000)
      );
    } else {
      timestampSet.add(new Date().getTime() / 1000);
    }
    return [...timestampSet].sort((a, b) => a - b);
  }, [mergedData, baseChoiceItems]);

  if (!methods.length || !mergedData) {
    if (!methods.length) {
      return (
        <EmptyGraphState
          variant="empty"
          message={t("selectAggregationFromSidePanel")}
        />
      );
    }
    if (isAnyPending) {
      return (
        <EmptyGraphState
          variant="loading"
          message={t("loadingAggregationData")}
        />
      );
    }
    return (
      <EmptyGraphState
        variant="error"
        message={t("failedToLoadAggregationData")}
      />
    );
  }

  const choiceItems = baseChoiceItems.map((item) => ({
    ...item,
    highlighted: hoveredId !== null && item.choice === hoveredId,
  }));

  const choiceColorById = new Map(
    choiceItems.map((item) => [item.choice, item.color])
  );

  const actualCloseTime = getPostDrivenTime(mergedData.actual_close_time);
  const effectiveChartTimestamp = cursorTimestamp ?? timestamps.at(-1) ?? null;

  const isNumericType = NUMERIC_TYPES.has(mergedData.type);
  const errorMethods = methods.filter((method) => method.isError);

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-700-dark">
        {t("timeline")}
      </h2>

      <div ref={sentinelRef} className="-mb-px h-px" />
      <div
        className={`sticky top-header z-100 bg-white px-4 transition-shadow duration-200 dark:border dark:border-gray-500-dark dark:bg-blue-950 ${isStuck ? "rounded-b-md py-1 shadow-xl ring-1 ring-black/5 dark:ring-white/10" : "rounded-md py-4 shadow-sm"}`}
      >
        <GroupChart
          timestamps={timestamps}
          actualCloseTime={actualCloseTime}
          choiceItems={choiceItems}
          defaultZoom={TimelineChartZoomOption.All}
          height={isStuck ? (isDesktop ? 150 : 100) : isDesktop ? 300 : 200}
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
      {/* Spacer compensates for height reduction when stuck so content below doesn't jump */}
      <div style={{ height: isStuck ? (isDesktop ? 174 : 124) : 0 }} />

      <div className="my-4 flex flex-row items-center justify-between gap-2">
        <h2 className="my-0 text-xs font-semibold uppercase leading-none tracking-wide text-gray-700 dark:text-gray-700-dark">
          {isNumericType ? t("distributionViews") : t("histogramViews")}
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

      <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {methods.map((method) => (
          <DistributionCard
            key={method.id}
            postId={postId}
            questionTitle={questionTitle}
            selectedSubQuestionOption={selectedSubQuestionOption}
            method={method}
            mergedData={mergedData}
            cursorTimestamp={cursorTimestamp}
            effectiveChartTimestamp={effectiveChartTimestamp}
            optionIndex={optionIndex}
            graphType={graphType}
            isNumericType={isNumericType}
            choiceColor={choiceColorById.get(method.id)?.DEFAULT ?? "#9ca3af"}
            chartHeight={isDesktop ? 150 : 100}
            onHoverOption={onHoverOption}
          />
        ))}
      </div>

      {hasAnyError && errorMethods.length > 0 ? (
        <div className="rounded-md border border-red-300 p-3 text-sm text-red-600 dark:border-red-500/40 dark:text-red-400">
          {t("someMethodsFailed", {
            methods: errorMethods.map((method) => method.label).join(", "),
          })}
        </div>
      ) : null}
    </div>
  );
}
