"use client";

import { useTranslations } from "next-intl";
import { FC, useCallback, useState, memo, useMemo } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import useDebounce from "@/hooks/use_debounce";
import {
  AggregationQuestion,
  Aggregations,
  QuestionType,
} from "@/types/question";
import { getDisplayValue } from "@/utils/charts";

import ContinuousAggregationChart from "./continuous_aggregations_chart";
import HistogramDrawer from "./histogram_drawer";
import DetailsQuestionCardErrorBoundary from "../../questions/[id]/components/detailed_question_card/error_boundary";
import CursorDetailItem from "../../questions/[id]/components/detailed_question_card/numeric_cursor_item";

type Props = {
  questionData: AggregationQuestion;
  activeTab: keyof Aggregations;
};

const AggregationsTab: FC<Props> = ({ questionData, activeTab }) => {
  const t = useTranslations();

  const {
    aggregations,
    actual_close_time,
    scaling,
    type: qType,
    resolution,
  } = questionData;

  const activeAggregation = useMemo(
    () => aggregations[activeTab],
    [activeTab, aggregations]
  );

  const actualCloseTime = useMemo(
    () => (actual_close_time ? new Date(actual_close_time).getTime() : null),
    [actual_close_time]
  );
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(
    activeAggregation
      ? activeAggregation.history[activeAggregation.history.length - 1]
          .start_time
      : null
  );
  const aggregationTimestamp = useDebounce(cursorTimestamp, 500);

  const cursorData = useMemo(() => {
    if (!activeAggregation) {
      return null;
    }

    const index = activeAggregation.history.findIndex(
      (f) => f.start_time === cursorTimestamp
    );

    const forecast =
      index === -1
        ? activeAggregation.history[activeAggregation.history.length - 1]
        : activeAggregation.history[index];

    return {
      timestamp: forecast.start_time ?? cursorTimestamp,
      forecasterCount: forecast.forecaster_count,
      interval_lower_bound: forecast.interval_lower_bounds![0],
      center: forecast.centers![0],
      interval_upper_bound: forecast.interval_upper_bounds![0],
    };
  }, [activeAggregation, cursorTimestamp]);

  const handleCursorChange = useCallback(
    (value: number | null) => {
      const fallback = activeAggregation
        ? activeAggregation.history[activeAggregation.history.length - 1]
            .start_time
        : null;

      setCursorTimestamp(value ?? fallback);
    },
    [activeAggregation]
  );

  if (!activeAggregation) {
    return null;
  }

  const renderAggregation = () => {
    switch (qType) {
      case QuestionType.Binary:
        return (
          <HistogramDrawer
            questionData={questionData}
            activeTab={activeTab}
            selectedTimestamp={aggregationTimestamp}
          />
        );
      case QuestionType.Numeric:
      case QuestionType.Date:
        return (
          <ContinuousAggregationChart
            selectedTimestamp={aggregationTimestamp}
            questionData={questionData}
            activeTab={activeTab}
          />
        );
      default:
        return <div>Unsupported question type!</div>;
    }
  };

  return (
    <DetailsQuestionCardErrorBoundary>
      <NumericChart
        aggregation={activeAggregation}
        questionType={qType}
        actualCloseTime={actualCloseTime}
        scaling={scaling}
        resolution={resolution}
        onCursorChange={handleCursorChange}
      />
      {!!cursorData && (
        <div className="my-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 xs:gap-x-8 sm:mx-8 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-0">
          <CursorDetailItem
            title={t("totalForecastersLabel")}
            text={cursorData.forecasterCount?.toString()}
          />
          <CursorDetailItem
            title={t("communityPredictionLabel")}
            text={getDisplayValue(cursorData.center, qType, scaling)}
            variant="prediction"
          />
        </div>
      )}

      {renderAggregation()}
    </DetailsQuestionCardErrorBoundary>
  );
};

export default memo(AggregationsTab);
