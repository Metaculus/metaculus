"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useRef } from "react";

import ContinuousAreaChart, {
  ContinuousAreaGraphInput,
  getContinuousAreaChartData,
} from "@/components/charts/continuous_area_chart";
import GroupChart from "@/components/charts/group_chart";
import { buildNumericChartData } from "@/components/charts/helpers";
import Histogram from "@/components/charts/histogram";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import NumericChart from "@/components/charts/numeric_chart";
import { MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { getEffectiveVisibleCount } from "@/constants/questions";
import { TimelineChartZoomOption } from "@/types/charts";
import { PostWithForecasts, QuestionStatus } from "@/types/post";
import { QuestionType } from "@/types/question";
import { getResolutionPoint } from "@/utils/charts/resolution";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { isQuestionPost } from "@/utils/questions/helpers";

import {
  getAggregationTimestamps,
  getChoiceItems,
} from "../config/chart_data_helpers";
import {
  ExportableChartType,
  getExportQuestion,
} from "../config/chart_exportables";

type Props = {
  post: PostWithForecasts;
  chartType: ExportableChartType;
  dimensions: { width: number; height: number };
  onChartReady: () => void;
  onNoData: () => void;
};

const ChartContent: FC<Props> = ({
  post,
  chartType,
  dimensions,
  onChartReady,
  onNoData,
}) => {
  const t = useTranslations();
  const question = getExportQuestion(post);
  const chart = renderChart(
    question,
    post,
    chartType,
    dimensions,
    onChartReady,
    t("ifYes"),
    t("ifNo")
  );
  const calledNoData = useRef(false);

  useEffect(() => {
    if (!chart && !calledNoData.current) {
      calledNoData.current = true;
      onNoData();
    }
  }, [chart, onNoData]);

  return chart;
};

function renderChart(
  question: ReturnType<typeof getExportQuestion>,
  post: PostWithForecasts,
  chartType: ExportableChartType,
  dimensions: { width: number; height: number },
  onChartReady: () => void,
  ifYesLabel: string,
  ifNoLabel: string
) {
  switch (chartType) {
    case ExportableChartType.ForecastTimeline: {
      if (!question) return null;
      const aggregation =
        question.aggregations[question.default_aggregation_method];
      if (!aggregation?.history?.length) return null;

      const actualCloseTimeMs = question.actual_close_time
        ? new Date(question.actual_close_time).getTime()
        : null;

      const resolutionPoint =
        question.resolution && actualCloseTimeMs
          ? (() => {
              const resolveTime = question.actual_resolve_time;
              if (!resolveTime) return null;
              const resolveSec = Math.floor(
                new Date(resolveTime).getTime() / 1000
              );
              return getResolutionPoint({
                lastAggregation: aggregation.latest,
                questionType: question.type,
                resolution: question.resolution,
                resolveTime: Math.min(
                  resolveSec,
                  Math.floor(actualCloseTimeMs / 1000)
                ),
                scaling: question.scaling,
                size: 5,
              });
            })()
          : null;

      return (
        <NumericChart
          resolutionPoint={resolutionPoint ? [resolutionPoint] : undefined}
          resolution={
            question.resolution != null
              ? String(question.resolution)
              : undefined
          }
          buildChartData={(width, zoom) => {
            const data = buildNumericChartData({
              questionType: question.type,
              actualCloseTime: actualCloseTimeMs,
              scaling: question.scaling,
              height: dimensions.height,
              aggregation,
              aggregationIndex: 0,
              width,
              zoom,
              openTime: question.open_time
                ? new Date(question.open_time).getTime() / 1000
                : undefined,
              unit: question.unit,
              alwaysShowYTicks: true,
              forceYTickCount: 5,
            });
            return data;
          }}
          height={dimensions.height}
          questionType={question.type}
          nonInteractive
          hideCP={false}
          questionStatus={question.status as unknown as QuestionStatus}
          yLabel={question.unit || undefined}
          getCursorValue={(value) => {
            const display = getPredictionDisplayValue(value, {
              questionType: question.type,
              scaling: question.scaling,
              unit: question.unit,
              actual_resolve_time: question.actual_resolve_time ?? null,
            });
            return display.split("\n")[0] ?? display;
          }}
          onChartReady={onChartReady}
        />
      );
    }

    case ExportableChartType.Histogram: {
      if (!question) return null;
      const agg = question.aggregations[question.default_aggregation_method];
      const latestHistogram = agg?.latest?.histogram;
      if (!latestHistogram) return null;

      const histData = latestHistogram[0];
      if (!histData?.length) return null;

      const histogramData = histData.map((value: number, index: number) => ({
        x: index,
        y: value,
      }));
      const median = agg.latest?.centers?.[0] ?? null;
      const mean = agg.latest?.means?.[0] ?? null;
      const isClosed = question.status === "closed";

      return (
        <Histogram
          histogramData={histogramData}
          median={median}
          mean={mean}
          color={isClosed ? "gray" : "blue"}
          width={dimensions.width}
          onChartReady={onChartReady}
        />
      );
    }

    case ExportableChartType.FullSizePdf: {
      if (!question) return null;
      const data: ContinuousAreaGraphInput = getContinuousAreaChartData({
        question,
        isClosed: false,
        isResolved: false,
      });
      if (!data.length) return null;

      return (
        <ContinuousAreaChart
          question={question}
          data={data}
          graphType="pmf"
          height={dimensions.height}
          width={dimensions.width}
          hideCP={false}
          onChartReady={onChartReady}
        />
      );
    }

    case ExportableChartType.FullSizeCdf: {
      if (!question) return null;
      const cdfData: ContinuousAreaGraphInput = getContinuousAreaChartData({
        question,
        isClosed: false,
        isResolved: false,
      });
      if (!cdfData.length) return null;

      return (
        <ContinuousAreaChart
          question={question}
          data={cdfData}
          graphType="cdf"
          height={dimensions.height}
          width={dimensions.width}
          hideCP={false}
          onChartReady={onChartReady}
        />
      );
    }

    case ExportableChartType.Timeline: {
      const allChoiceItems = getChoiceItems(post, ifYesLabel, ifNoLabel);
      const visibleCount = getEffectiveVisibleCount(allChoiceItems.length);
      // Sort by latest value descending to pick top options (same as in-app)
      const sorted = [...allChoiceItems].sort((a, b) => {
        const aVal = a.aggregationValues.at(-1) ?? 0;
        const bVal = b.aggregationValues.at(-1) ?? 0;
        return bVal - aVal;
      });
      const choiceItems = sorted.slice(0, visibleCount).map((item, i) => ({
        ...item,
        color:
          MULTIPLE_CHOICE_COLOR_SCALE[i % MULTIPLE_CHOICE_COLOR_SCALE.length] ??
          item.color,
      }));
      const timestamps = getAggregationTimestamps(post);
      const effectiveTimestamps =
        timestamps.length > 0
          ? timestamps
          : choiceItems[0]?.aggregationTimestamps ?? [];
      if (!choiceItems.length || !effectiveTimestamps.length) return null;

      const timelineCloseTime = question?.actual_close_time
        ? new Date(question.actual_close_time).getTime()
        : null;

      if (
        isQuestionPost(post) &&
        post.question.type === QuestionType.MultipleChoice
      ) {
        return (
          <MultipleChoiceChart
            timestamps={effectiveTimestamps}
            choiceItems={choiceItems}
            actualCloseTime={timelineCloseTime}
            height={dimensions.height}
            hideCP={false}
            defaultZoom={TimelineChartZoomOption.All}
            onChartReady={onChartReady}
          />
        );
      }

      return (
        <GroupChart
          timestamps={effectiveTimestamps}
          choiceItems={choiceItems}
          actualCloseTime={timelineCloseTime}
          height={dimensions.height}
          hideCP={false}
          defaultZoom={TimelineChartZoomOption.All}
          onChartReady={onChartReady}
        />
      );
    }

    default:
      return null;
  }
}

export default ChartContent;
