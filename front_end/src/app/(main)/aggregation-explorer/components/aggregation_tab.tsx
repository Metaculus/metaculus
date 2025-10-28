"use client";

import { saveAs } from "file-saver";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState, memo, useMemo } from "react";
import toast from "react-hot-toast";

import NumericTimeline from "@/components/charts/numeric_timeline";
import DetailsQuestionCardErrorBoundary from "@/components/detailed_question_card/detailed_question_card/error_boundary";
import CursorDetailItem from "@/components/detailed_question_card/detailed_question_card/numeric_cursor_item";
import Button from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use_debounce";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { QuestionType } from "@/types/question";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { getPostDrivenTime } from "@/utils/questions/helpers";

import ContinuousAggregationChart from "./continuous_aggregations_chart";
import HistogramDrawer from "./histogram_drawer";
import { AGGREGATION_EXPLORER_OPTIONS } from "../constants";
import { AggregationExtraQuestion } from "../types";

type Props = {
  aggregationData: AggregationExtraQuestion | null;
  activeTab: string;
  selectedSubQuestionOption: number | string | null;
  postId: number;
  questionTitle: string;
  userIds?: number[];
};

const AggregationsTab: FC<Props> = ({
  aggregationData,
  activeTab,
  selectedSubQuestionOption,
  postId,
  questionTitle,
  userIds,
}) => {
  const t = useTranslations();

  const {
    aggregations,
    actual_close_time,
    resolution,
    unit,
    forecasters_count = 0,
  } = aggregationData ?? {};

  const tabData =
    AGGREGATION_EXPLORER_OPTIONS.find((option) => option.id === activeTab) ??
    AGGREGATION_EXPLORER_OPTIONS[0];

  const activeAggregation = useMemo(
    () => aggregations?.[tabData.id],
    [aggregations, tabData]
  );

  let aggregationIndex: number | undefined;
  if (
    typeof selectedSubQuestionOption === "string" &&
    aggregationData?.options
  ) {
    const indexCandidate = aggregationData.options.findIndex(
      (o) => o === selectedSubQuestionOption
    );
    if (indexCandidate !== -1) {
      aggregationIndex = indexCandidate;
    }
  }

  const actualCloseTime = useMemo(
    () => getPostDrivenTime(actual_close_time),
    [actual_close_time]
  );
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
  const aggregationTimestamp = useDebouncedValue(
    cursorTimestamp ?? activeAggregation?.history?.at(-1)?.start_time ?? null,
    500
  );

  const cursorData = useMemo(() => {
    if (!activeAggregation) {
      return null;
    }

    const index = isNil(cursorTimestamp)
      ? -1
      : activeAggregation.history.findLastIndex(
          (f) => f.start_time <= cursorTimestamp
        );

    const forecast =
      index === -1
        ? activeAggregation.history.at(-1)
        : activeAggregation.history[index];

    if (!forecast) {
      return null;
    }

    return {
      timestamp: forecast.start_time ?? cursorTimestamp,
      forecasterCount:
        cursorTimestamp === null
          ? forecasters_count
          : forecast.forecaster_count,
      interval_lower_bound: forecast.interval_lower_bounds?.[0] ?? 0,
      center: forecast.centers?.[0] ?? forecast.forecast_values?.[1] ?? 0,
      interval_upper_bound: forecast.interval_upper_bounds?.[0] ?? 0,
    };
  }, [activeAggregation, cursorTimestamp, forecasters_count]);

  const handleCursorChange = useCallback((value: number | null) => {
    setCursorTimestamp(value);
  }, []);

  if (!activeAggregation) {
    return null;
  }

  const renderAggregation = (questionData: AggregationExtraQuestion) => {
    switch (questionData.type) {
      case QuestionType.Binary:
        return (
          <HistogramDrawer
            activeAggregation={activeAggregation}
            questionData={questionData}
            selectedTimestamp={aggregationTimestamp}
          />
        );
      case QuestionType.MultipleChoice:
        return (
          <HistogramDrawer
            activeAggregation={activeAggregation}
            questionData={questionData}
            selectedTimestamp={aggregationTimestamp}
            aggregationIndex={aggregationIndex}
          />
        );
      case QuestionType.Numeric:
      case QuestionType.Discrete:
      case QuestionType.Date:
        return (
          <ContinuousAggregationChart
            activeAggregation={activeAggregation}
            selectedTimestamp={aggregationTimestamp}
            questionData={questionData}
          />
        );
      default:
        return <div>{t("unsupportedQuestionType")}</div>;
    }
  };

  if (!aggregationData || !activeAggregation.history.length) {
    return (
      <p className="my-5 text-center text-gray-500 dark:text-gray-500-dark">
        {!aggregationData
          ? t("aggregationDataIsNotAvailable")
          : t("noAggregationData")}
      </p>
    );
  }

  const handleDownloadQuestionData = async () => {
    try {
      const aggregationMethod = tabData.value;

      const blob = await ClientPostsApi.getAggregationsPostZipData(
        postId,
        typeof selectedSubQuestionOption === "number"
          ? selectedSubQuestionOption
          : undefined,
        aggregationMethod,
        tabData.includeBots,
        userIds
      );
      const filename = `${questionTitle.replaceAll(" ", "_")}-${aggregationMethod}${tabData.includeBots ? "-bots" : ""}.zip`;
      saveAs(blob, filename);
    } catch (error) {
      toast.error(t("downloadQuestionDataError") + error);
    }
  };

  return (
    <>
      {activeTab && (
        <div className="flex flex-col justify-between">
          <Button
            variant="text"
            onClick={handleDownloadQuestionData}
            className="w-fit cursor-pointer p-0 text-sm text-gray-500 underline dark:text-gray-500-dark"
          >
            {t("downloadQuestionData")}
          </Button>
          <p className="w-fit bg-gray-400 p-2 dark:bg-gray-400-dark">
            {
              AGGREGATION_EXPLORER_OPTIONS.find(
                (option) => option.id === activeTab
              )?.label
            }
          </p>
        </div>
      )}
      <DetailsQuestionCardErrorBoundary>
        <NumericTimeline
          aggregation={activeAggregation}
          aggregationIndex={aggregationIndex}
          questionType={aggregationData.type}
          actualCloseTime={actualCloseTime}
          scaling={aggregationData.scaling}
          resolution={resolution}
          resolveTime={aggregationData.actual_resolve_time}
          cursorTimestamp={cursorTimestamp}
          onCursorChange={handleCursorChange}
          unit={unit}
          simplifiedCursor={aggregationData.type !== QuestionType.Binary}
          questionStatus={aggregationData.status}
        />

        {!!cursorData && (
          <div className="my-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 xs:gap-x-8 sm:mx-8 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-0">
            <CursorDetailItem
              title={
                cursorTimestamp
                  ? t("activeForecastersLabel")
                  : t("totalForecastersLabel")
              }
              content={cursorData.forecasterCount?.toString()}
            />
            <CursorDetailItem
              title={t("communityPredictionLabel")}
              content={getPredictionDisplayValue(cursorData.center, {
                questionType: aggregationData.type,
                scaling: aggregationData.scaling,
                range: cursorData?.interval_lower_bound
                  ? [
                      cursorData?.interval_lower_bound as number,
                      cursorData?.interval_upper_bound as number,
                    ]
                  : [],
                actual_resolve_time: aggregationData.actual_resolve_time,
              })}
              variant="prediction"
            />
          </div>
        )}

        {renderAggregation(aggregationData)}
      </DetailsQuestionCardErrorBoundary>
    </>
  );
};

export default memo(AggregationsTab);
