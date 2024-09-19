"use client";

import { FC, useCallback, useState, memo, useMemo } from "react";
import {
  AggregationQuestion,
  Aggregations,
  QuestionType,
  Scaling,
} from "@/types/question";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import { Line, Scale, TimelineChartZoomOption } from "@/types/charts";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import {
  displayValue,
  findPreviousTimestamp,
  generateNumericDomain,
  generateTicksY,
  generateTimestampXScale,
  getDisplayValue,
  scaleInternalLocation,
} from "@/utils/charts";
import AggregationTooltip from "./aggregation_tooltip";
import DetailsQuestionCardErrorBoundary from "../../questions/[id]/components/detailed_question_card/error_boundary";
import { ChartData } from "@/components/charts/numeric_chart";
import { Tuple } from "victory";
import NumericAggregationChart from "./numeric_aggregations_chart";
import Histogram from "@/components/charts/histogram";
import classNames from "classnames";
import CursorDetailItem from "../../questions/[id]/components/detailed_question_card/numeric_cursor_item";
import { useTranslations } from "next-intl";
import ContinuousAggregationChart from "./continuous_aggregations_chart";

type Props = {
  questionData: AggregationQuestion;
  activeTab: keyof Aggregations;
};

const AggregationsTab: FC<Props> = memo(({ questionData, activeTab }) => {
  const t = useTranslations();
  const {
    aggregations,
    actual_close_time,
    scaling,
    type: qType,
    resolution,
  } = questionData;
  const activeAggregation = aggregations[activeTab];
  if (!activeAggregation) {
    return null;
  } else if (!activeAggregation.history.length) {
    return <p>Aggregation data is empty!</p>;
  }

  const actualCloseTime = actual_close_time
    ? new Date(actual_close_time).getTime()
    : null;
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(
    activeAggregation.history[activeAggregation.history.length - 1].start_time
  );
  console.log(cursorTimestamp);
  const cursorData = useMemo(() => {
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
  }, [cursorTimestamp, activeAggregation.history]);

  const handleCursorChange = useCallback((value: number | null) => {
    setCursorTimestamp(value);
  }, []);

  switch (qType) {
    case QuestionType.Binary:
      return (
        <>
          <DetailsQuestionCardErrorBoundary>
            <NumericAggregationChart
              aggregationData={activeAggregation}
              questionType={qType}
              actualCloseTime={actualCloseTime}
              scaling={scaling}
              resolution={resolution}
              onCursorChange={handleCursorChange}
            />
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
          </DetailsQuestionCardErrorBoundary>
          {/* check for histogram data in response */}
          {/* <Histogram
            histogramData={histogramData}
            median={median}
            mean={mean}
            color={"green"}
          /> */}
        </>
      );
    case QuestionType.Numeric:
    case QuestionType.Date:
      return (
        <>
          <DetailsQuestionCardErrorBoundary>
            <NumericAggregationChart
              aggregationData={activeAggregation}
              questionType={qType}
              actualCloseTime={actualCloseTime}
              scaling={scaling}
              resolution={resolution}
              onCursorChange={handleCursorChange}
            />
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
          </DetailsQuestionCardErrorBoundary>
          
          <ContinuousAggregationChart
            questionData={questionData}
            activeTab={activeTab}
          />
        </>
      );
    default:
      return <div>Unsupported question type!</div>;
  }
});

export default AggregationsTab;

const getAggregationTimestamps = (aggregations: Aggregations) => {
  // Find populated aggregation and map timestamps
  for (const key in aggregations) {
    const aggregationKey = key as keyof Aggregations;
    const aggregation = aggregations[aggregationKey];

    if (aggregation?.history && !!aggregation.history.length) {
      return aggregation.history.map((forecast) => forecast.start_time);
    }
  }
  return [];
};
