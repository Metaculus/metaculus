"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useRef } from "react";

import ContinuousAreaChart, {
  ContinuousAreaGraphInput,
  getContinuousAreaChartData,
} from "@/components/charts/continuous_area_chart";
import GroupChart from "@/components/charts/group_chart";
import Histogram from "@/components/charts/histogram";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import NumericTimeline from "@/components/charts/numeric_timeline";
import { getEffectiveVisibleCount } from "@/constants/questions";
import { TimelineChartZoomOption } from "@/types/charts";
import { PostWithForecasts, QuestionStatus } from "@/types/post";
import { QuestionType } from "@/types/question";
import { buildChoicesWithOthers } from "@/utils/questions/choices";
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
    t,
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
  t: ReturnType<typeof useTranslations>,
  ifYesLabel: string,
  ifNoLabel: string
) {
  switch (chartType) {
    case ExportableChartType.ForecastTimeline: {
      if (!question) return null;
      const aggregation =
        question.aggregations[question.default_aggregation_method];
      if (!aggregation?.history?.length) return null;

      return (
        <NumericTimeline
          aggregation={aggregation}
          questionType={question.type}
          actualCloseTime={
            question.actual_close_time
              ? new Date(question.actual_close_time).getTime()
              : null
          }
          scaling={question.scaling}
          resolution={question.resolution}
          resolveTime={question.actual_resolve_time ?? null}
          questionStatus={question.status as unknown as QuestionStatus}
          height={dimensions.height}
          unit={question.unit}
          openTime={
            question.open_time
              ? new Date(question.open_time).getTime() / 1000
              : undefined
          }
          nonInteractive
          hideCP={false}
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
      const totalCount = getChoiceItems(post, t, ifYesLabel, ifNoLabel).length;
      const visibleCount = getEffectiveVisibleCount(totalCount);
      const normalized = getChoiceItems(
        post,
        t,
        ifYesLabel,
        ifNoLabel,
        visibleCount
      );
      const isMC =
        isQuestionPost(post) &&
        post.question.type === QuestionType.MultipleChoice;
      const choiceItems = isMC
        ? buildChoicesWithOthers(normalized)
        : normalized.filter((item) => item.active);
      const timestamps = getAggregationTimestamps(post);
      const effectiveTimestamps =
        timestamps.length > 0
          ? timestamps
          : choiceItems[0]?.aggregationTimestamps ?? [];
      if (!choiceItems.length || !effectiveTimestamps.length) return null;

      const timelineCloseTime = question?.actual_close_time
        ? new Date(question.actual_close_time).getTime()
        : null;

      if (isMC) {
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
