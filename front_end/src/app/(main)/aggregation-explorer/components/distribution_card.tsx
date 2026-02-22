"use client";

import {
  faArrowsLeftRight,
  faBullseye,
  faFileArrowDown,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { saveAs } from "file-saver";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";

import ClientPostsApi from "@/services/api/posts/posts.client";
import { ContinuousAreaGraphType } from "@/types/charts";
import {
  AggregateForecastHistory,
  NumericAggregateForecastHistory,
} from "@/types/question";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";

import AggregationLabel from "./aggregation_label";
import ContinuousAggregationChartControlled from "./continuous_aggregation_chart_controlled";
import HistogramDrawer from "./histogram_drawer";
import { AggregationQueryResult } from "../hooks/aggregation-data";
import {
  AggregationExtraQuestion,
  NumericAggregationExtraQuestion,
} from "../types";

type Props = {
  postId: number;
  questionTitle: string;
  selectedSubQuestionOption: string | number | null;
  method: AggregationQueryResult;
  mergedData: AggregationExtraQuestion;
  cursorTimestamp: number | null;
  effectiveChartTimestamp: number | null;
  optionIndex: number;
  graphType: ContinuousAreaGraphType;
  isNumericType: boolean;
  choiceColor: string;
  chartHeight?: number;
  onHoverOption?: (id: string | null) => void;
};

export default function DistributionCard({
  postId,
  questionTitle,
  selectedSubQuestionOption,
  method,
  mergedData,
  cursorTimestamp,
  effectiveChartTimestamp,
  optionIndex,
  graphType,
  isNumericType,
  choiceColor,
  chartHeight,
  onHoverOption,
}: Props) {
  const t = useTranslations();
  const [isDownloading, setIsDownloading] = useState(false);

  const aggregation = (
    mergedData.aggregations as Record<
      string,
      AggregateForecastHistory | undefined
    >
  )[method.id];
  if (!aggregation?.history.length) return null;

  const historyIndex = isNil(cursorTimestamp)
    ? -1
    : aggregation.history.findLastIndex((f) => f.start_time <= cursorTimestamp);
  const forecast =
    historyIndex === -1
      ? aggregation.history.at(-1)
      : aggregation.history[historyIndex];
  if (!forecast) return null;

  const forecasterCount = forecast.forecaster_count ?? 0;
  const center =
    forecast.centers?.[optionIndex] ?? forecast.forecast_values?.[1] ?? null;
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

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await ClientPostsApi.getAggregationsPostZipData(
        postId,
        typeof selectedSubQuestionOption === "number"
          ? selectedSubQuestionOption
          : undefined,
        method.method,
        method.includeBots,
        method.userIds,
        method.joinedBeforeDate
      );
      const safeName = `${questionTitle}-${method.id}`
        .replace(/[^A-Za-z0-9_.\-]/g, "_")
        .replace(/_+/g, "_");
      saveAs(blob, `${safeName}.zip`);
    } catch (error) {
      toast.error(
        t("downloadQuestionDataError") +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="rounded-md bg-white p-3 dark:border dark:border-gray-600 dark:bg-blue-950"
      onMouseEnter={() => onHoverOption?.(method.id)}
      onMouseLeave={() => onHoverOption?.(null)}
    >
      <div className="flex min-h-[2.5rem] items-start justify-between gap-2 text-xs text-gray-800 dark:text-gray-200">
        <AggregationLabel
          label={method.baseLabel}
          chips={method.chips}
          color={choiceColor}
        />
        <span className="flex shrink-0 items-center gap-1.5 text-gray-700 dark:text-gray-400">
          <FontAwesomeIcon
            icon={faUsers}
            className="text-gray-400 dark:text-gray-400-dark"
          />
          <span className="font-medium tabular-nums">{forecasterCount}</span>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="text-gray-400 transition-colors hover:text-blue-600 disabled:opacity-50 dark:text-gray-400-dark dark:hover:text-blue-400"
            aria-label={t("downloadQuestionData")}
            title={t("downloadQuestionData")}
          >
            <FontAwesomeIcon icon={faFileArrowDown} />
          </button>
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
            activeAggregation={aggregation as NumericAggregateForecastHistory}
            selectedTimestamp={effectiveChartTimestamp}
            questionData={mergedData as NumericAggregationExtraQuestion}
            graphType={graphType}
            chartHeight={chartHeight}
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
}
