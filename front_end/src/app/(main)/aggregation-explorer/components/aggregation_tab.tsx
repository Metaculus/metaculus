"use client";

import { useTranslations } from "next-intl";
import { FC, useCallback, useState, memo, useMemo, useEffect } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useDebouncedValue } from "@/hooks/use_debounce";
import {
  AggregationMethod,
  AggregationMethodWithBots,
  AggregationQuestionWithBots,
  QuestionType,
} from "@/types/question";
import { getDisplayValue } from "@/utils/charts";

import ContinuousAggregationChart from "./continuous_aggregations_chart";
import HistogramDrawer from "./histogram_drawer";
import DetailsQuestionCardErrorBoundary from "../../questions/[id]/components/detailed_question_card/error_boundary";
import CursorDetailItem from "../../questions/[id]/components/detailed_question_card/numeric_cursor_item";

type Props = {
  questionData: AggregationQuestionWithBots | null;
  activeTab: AggregationMethodWithBots;
  onFetchData: ({
    postId,
    questionId,
    includeBots,
    aggregationMethod,
  }: {
    postId: string;
    questionId?: string | null;
    includeBots?: boolean;
    aggregationMethod: AggregationMethod;
  }) => Promise<void>;
  postId: number;
  questionId?: number | null;
};

const AggregationsTab: FC<Props> = ({
  questionData,
  activeTab,
  onFetchData,
  postId,
  questionId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();

  const { aggregations, bot_aggregations, actual_close_time, resolution } =
    questionData ?? {};
  const isBotAggregation = activeTab.includes("bot");
  const aggregationMethod = isBotAggregation
    ? (activeTab.replace("_bot", "") as AggregationMethod)
    : (activeTab as unknown as AggregationMethod);
  const activeAggregation = useMemo(
    () =>
      isBotAggregation
        ? bot_aggregations?.[aggregationMethod]
        : aggregations?.[aggregationMethod],
    [aggregations, bot_aggregations, isBotAggregation, aggregationMethod]
  );

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      await onFetchData({
        postId: postId.toString(),
        questionId: questionId?.toString(),
        includeBots: isBotAggregation,
        aggregationMethod: aggregationMethod as AggregationMethod,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isBotAggregation, aggregationMethod, onFetchData, postId, questionId]);

  useEffect(() => {
    if (!activeAggregation?.history?.length) {
      fetchData();
    }
  }, [activeAggregation, fetchData]);

  const actualCloseTime = useMemo(
    () => (actual_close_time ? new Date(actual_close_time).getTime() : null),
    [actual_close_time]
  );
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(
    activeAggregation?.history?.at(-1)?.start_time ?? null
  );
  const aggregationTimestamp = useDebouncedValue(cursorTimestamp, 500);

  const cursorData = useMemo(() => {
    if (!activeAggregation) {
      return null;
    }

    const index = activeAggregation.history.findIndex(
      (f) => f.start_time === cursorTimestamp
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
      forecasterCount: forecast.forecaster_count,
      interval_lower_bound: forecast.interval_lower_bounds?.[0] ?? 0,
      center: forecast.centers?.[0] ?? forecast.forecast_values?.[1] ?? 0,
      interval_upper_bound: forecast.interval_upper_bounds?.[0] ?? 0,
    };
  }, [activeAggregation, cursorTimestamp]);

  const handleCursorChange = useCallback(
    (value: number | null) => {
      const fallback = activeAggregation?.history?.at(-1)?.start_time ?? null;

      setCursorTimestamp(value ?? fallback);
    },
    [activeAggregation]
  );

  if (isLoading) {
    return <LoadingIndicator className="my-20 h-10" />;
  } else if (!activeAggregation) {
    return null;
  }

  const renderAggregation = (questionData: AggregationQuestionWithBots) => {
    switch (questionData.type) {
      case QuestionType.Binary:
        return (
          <HistogramDrawer
            activeAggregation={activeAggregation}
            questionData={questionData}
            selectedTimestamp={aggregationTimestamp}
          />
        );
      case QuestionType.Numeric:
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

  return (
    questionData && (
      <DetailsQuestionCardErrorBoundary>
        <NumericChart
          aggregation={activeAggregation}
          questionType={questionData.type}
          actualCloseTime={actualCloseTime}
          scaling={questionData.scaling}
          resolution={resolution}
          onCursorChange={handleCursorChange}
        />
        {!!cursorData && (
          <div className="my-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 xs:gap-x-8 sm:mx-8 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-0">
            <CursorDetailItem
              title={t("totalForecastersLabel")}
              content={cursorData.forecasterCount?.toString()}
            />
            <CursorDetailItem
              title={t("communityPredictionLabel")}
              content={getDisplayValue({
                value: cursorData.center,
                questionType: questionData.type,
                scaling: questionData.scaling,
              })}
              variant="prediction"
            />
          </div>
        )}

        {renderAggregation(questionData)}
      </DetailsQuestionCardErrorBoundary>
    )
  );
};

export default memo(AggregationsTab);
