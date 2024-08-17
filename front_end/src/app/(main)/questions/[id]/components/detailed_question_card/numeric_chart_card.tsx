"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import { useAuth } from "@/contexts/auth_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { Resolution } from "@/types/post";
import {
  QuestionType,
  Aggregations,
  UserForecastHistory,
} from "@/types/question";
import { getDisplayUserValue, getDisplayValue } from "@/utils/charts";

import CursorDetailItem from "./numeric_cursor_item";

type Props = {
  aggregrations: Aggregations;
  myForecasts: UserForecastHistory;
  questionType: QuestionType;
  rangeMin: number | null;
  rangeMax: number | null;
  zeroPoint: number | null;
  resolution?: Resolution | null;
  derivRatio?: number;
};

const NumericChartCard: FC<Props> = ({
  aggregrations,
  myForecasts,
  questionType,
  rangeMin,
  rangeMax,
  zeroPoint,
  resolution,
  derivRatio,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const [isChartReady, setIsChartReady] = useState(false);

  const [cursorTimestamp, setCursorTimestamp] = useState(
    aggregrations.recency_weighted.latest.start_time
  );
  const cursorData = useMemo(() => {
    const index = aggregrations.recency_weighted.history.findIndex(
      (f) => f.start_time === cursorTimestamp
    );
    const forecast = aggregrations.recency_weighted.history[index];
    return {
      timestamp: forecast.start_time,
      forecasterCount: forecast.forecaster_count,
      interval_lower_bound: forecast.interval_lower_bounds![0],
      center: forecast.centers![0],
      interval_upper_bound: forecast.interval_upper_bounds![0],
    };
  }, [cursorTimestamp]);

  const handleCursorChange = useCallback((value: number) => {
    setCursorTimestamp(value);
  }, []);

  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  return (
    <div
      className={classNames(
        "flex w-full flex-col",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      <NumericChart
        aggregations={aggregrations}
        myForecasts={myForecasts}
        resolution={resolution}
        onCursorChange={handleCursorChange}
        yLabel={t("communityPredictionLabel")}
        onChartReady={handleChartReady}
        questionType={questionType}
        rangeMin={rangeMin}
        rangeMax={rangeMax}
        zeroPoint={zeroPoint}
        derivRatio={derivRatio}
        defaultZoom={
          user ? TimelineChartZoomOption.All : TimelineChartZoomOption.TwoMonths
        }
        withZoomPicker
      />

      <div
        className={classNames(
          "my-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 xs:gap-x-8 sm:mx-8 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-0",
          { "sm:grid-cols-3": !!myForecasts.history.length }
        )}
      >
        <CursorDetailItem
          title={t("totalForecastersLabel")}
          text={cursorData.forecasterCount?.toString()}
        />
        <CursorDetailItem
          title={t("communityPredictionLabel")}
          text={getDisplayValue(
            cursorData.center,
            questionType,
            rangeMin,
            rangeMax,
            zeroPoint
          )}
          variant="prediction"
        />
        {!!myForecasts.history.length && (
          <CursorDetailItem
            title={t("myPredictionLabel")}
            text={getDisplayUserValue(
              myForecasts,
              cursorData.center,
              cursorData.timestamp,
              questionType,
              rangeMin,
              rangeMax,
              zeroPoint
            )}
            variant="my-prediction"
          />
        )}
      </div>
    </div>
  );
};

export default NumericChartCard;
