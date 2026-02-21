"use client";

import {
  faArrowsLeftRight,
  faBullseye,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
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
import {
  AggregateForecastHistory,
  NumericAggregateForecastHistory,
  QuestionType,
} from "@/types/question";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { getPostDrivenTime } from "@/utils/questions/helpers";

import AggregationLabel from "./aggregation_label";
import ContinuousAggregationChartControlled from "./continuous_aggregation_chart_controlled";
import HistogramDrawer from "../../aggregation-explorer/components/histogram_drawer";
import { generateChoiceItemsFromAggregations } from "../../aggregation-explorer/helpers";
import type { AggregationTooltip as V1AggregationTooltip } from "../../aggregation-explorer/types";
import { AggregationQueryResult } from "../hooks/aggregation-data";
import { useGraphTypeState } from "../hooks/query-state";
import {
  AggregationExtraMethod,
  AggregationExtraQuestion,
  AggregationTooltip,
  NumericAggregationExtraQuestion,
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

const NUMERIC_TYPES = [
  QuestionType.Numeric,
  QuestionType.Discrete,
  QuestionType.Date,
];

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
    let message: string;
    let borderClass: string;
    let textClass: string;
    if (!methods.length) {
      message = "Select at least one aggregation from the side panel.";
      borderClass = "border-dashed border-gray-300 dark:border-gray-500-dark";
      textClass = "text-gray-600 dark:text-gray-600-dark";
    } else if (isAnyPending) {
      message = "Loading selected aggregation data...";
      borderClass = "border-gray-300 dark:border-gray-500-dark";
      textClass = "text-gray-700 dark:text-gray-700-dark";
    } else {
      message = "Failed to load aggregation data for selected methods.";
      borderClass = "border-red-300 dark:border-red-500/40";
      textClass = "text-red-600 dark:text-red-400";
    }
    return (
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-700-dark">
          Timeline
        </h2>
        <div
          className={`mt-1 rounded-xl border p-8 text-sm ${borderClass} ${textClass}`}
        >
          {message}
        </div>
      </div>
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
    tooltips: tooltips as unknown as V1AggregationTooltip[],
  }).map((item) => ({
    ...item,
    resolution: null,
    displayedResolution: null,
    highlighted:
      hoveredId !== null &&
      item.choice === (hoveredId as unknown as AggregationExtraMethod),
  }));

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

  const isNumericType = NUMERIC_TYPES.includes(mergedData.type);
  const errorMethods = methods.filter((method) => method.isError);

  return (
    <div className="">
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
        {isNumericType && (
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
        )}
      </div>

      <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((method) => {
          const choiceItem = choiceItems.find(
            (item) =>
              item.choice === (method.id as unknown as AggregationExtraMethod)
          );
          if (!choiceItem) return null;

          const aggregation = (
            mergedData.aggregations as Record<
              string,
              AggregateForecastHistory | undefined
            >
          )[method.id];
          if (!aggregation?.history.length) return null;

          const historyIndex = isNil(cursorTimestamp)
            ? -1
            : aggregation.history.findLastIndex(
                (f) => f.start_time <= cursorTimestamp
              );
          const forecast =
            historyIndex === -1
              ? aggregation.history.at(-1)
              : aggregation.history[historyIndex];
          if (!forecast) return null;

          const forecasterCount = isNil(cursorTimestamp)
            ? aggregation.history.at(-1)?.forecaster_count ?? 0
            : forecast.forecaster_count ?? 0;
          const center =
            forecast.centers?.[optionIndex] ??
            forecast.forecast_values?.[1] ??
            0;
          const intervalLower = forecast.interval_lower_bounds?.[optionIndex];
          const intervalUpper = forecast.interval_upper_bounds?.[optionIndex];

          const predictionLabel = getPredictionDisplayValue(center, {
            questionType: mergedData.type,
            scaling: mergedData.scaling,
            range:
              !isNil(intervalLower) && !isNil(intervalUpper)
                ? [intervalLower, intervalUpper]
                : undefined,
            actual_resolve_time:
              "actual_resolve_time" in mergedData
                ? mergedData.actual_resolve_time
                : null,
          });

          return (
            <div
              key={method.id}
              className="rounded-md bg-white p-3 dark:border dark:border-gray-600 dark:bg-blue-950"
              onMouseEnter={() => onHoverOption?.(method.id)}
              onMouseLeave={() => onHoverOption?.(null)}
            >
              <div className="flex items-start justify-between gap-2 text-xs text-gray-800 dark:text-gray-200">
                <AggregationLabel
                  label={method.baseLabel}
                  chips={method.chips}
                  color={choiceItem.color.DEFAULT}
                />
                <span className="flex shrink-0 items-center gap-1 text-gray-700 dark:text-gray-400">
                  <FontAwesomeIcon
                    icon={faUsers}
                    className="text-gray-400 dark:text-gray-400-dark"
                  />
                  <span className="font-medium tabular-nums">
                    {forecasterCount}
                  </span>
                </span>
              </div>

              <div className="mt-2 flex flex-col gap-0.5 text-xs font-semibold text-olive-700 dark:text-olive-700-dark">
                {predictionLabel.split("\n").map((line, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <FontAwesomeIcon
                      icon={i === 0 ? faBullseye : faArrowsLeftRight}
                      className="shrink-0 text-olive-500 dark:text-olive-500-dark"
                    />
                    {line}
                  </div>
                ))}
              </div>

              <div className="mt-2">
                {isNumericType ? (
                  <ContinuousAggregationChartControlled
                    activeAggregation={
                      aggregation as NumericAggregateForecastHistory
                    }
                    selectedTimestamp={effectiveChartTimestamp}
                    questionData={mergedData as NumericAggregationExtraQuestion}
                    graphType={graphType}
                  />
                ) : (
                  <HistogramDrawer
                    activeAggregation={aggregation}
                    selectedTimestamp={effectiveChartTimestamp}
                    questionData={mergedData}
                    aggregationIndex={optionIndex}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasAnyError && errorMethods.length > 0 && (
        <div className="rounded-md border border-red-300 p-3 text-sm text-red-600 dark:border-red-500/40 dark:text-red-400">
          Some methods failed:{" "}
          {errorMethods.map((method) => method.label).join(", ")}.
        </div>
      )}
    </div>
  );
}
