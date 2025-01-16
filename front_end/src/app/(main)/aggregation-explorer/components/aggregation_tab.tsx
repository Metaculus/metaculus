"use client";

import { useTranslations } from "next-intl";
import { FC, useCallback, useState, memo, useMemo, useEffect } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useDebouncedValue } from "@/hooks/use_debounce";
import { QuestionType } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";

import ContinuousAggregationChart from "./continuous_aggregations_chart";
import HistogramDrawer from "./histogram_drawer";
import DetailsQuestionCardErrorBoundary from "../../questions/[id]/components/detailed_question_card/error_boundary";
import CursorDetailItem from "../../questions/[id]/components/detailed_question_card/numeric_cursor_item";
import { AGGREGATION_EXPLORER_OPTIONS } from "../constants";
import {
  AggregationMethodWithBots,
  AggregationQuestionWithBots,
} from "../types";

type Props = {
  aggregationData: AggregationQuestionWithBots | null;
  activeTab: string;
  onFetchData: (
    aggregationOptionId: AggregationMethodWithBots
  ) => Promise<void>;
};

const AggregationsTab: FC<Props> = ({
  aggregationData,
  activeTab,
  onFetchData,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();

  const { aggregations, bot_aggregations, actual_close_time, resolution } =
    aggregationData ?? {};

  const tabData =
    AGGREGATION_EXPLORER_OPTIONS.find((option) => option.id === activeTab) ??
    AGGREGATION_EXPLORER_OPTIONS[0];

  const activeAggregation = useMemo(
    () =>
      tabData?.includeBots
        ? bot_aggregations?.[tabData.value]
        : aggregations?.[tabData.value],
    [aggregations, bot_aggregations, tabData]
  );

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      await onFetchData(tabData.id);
    } finally {
      setIsLoading(false);
    }
  }, [tabData, onFetchData]);

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

  if (!aggregationData) {
    return null;
  }
  return (
    <DetailsQuestionCardErrorBoundary>
      <NumericChart
        aggregation={activeAggregation}
        questionType={aggregationData.type}
        actualCloseTime={actualCloseTime}
        scaling={aggregationData.scaling}
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
              questionType: aggregationData.type,
              scaling: aggregationData.scaling,
            })}
            variant="prediction"
          />
        </div>
      )}

      {renderAggregation(aggregationData)}
    </DetailsQuestionCardErrorBoundary>
  );
};

export default memo(AggregationsTab);
