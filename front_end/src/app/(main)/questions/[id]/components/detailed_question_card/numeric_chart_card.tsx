"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import { useAuth } from "@/contexts/auth_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { NumericForecast, QuestionType } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";

import CursorDetailItem from "./numeric_cursor_item";

type Props = {
  forecast: NumericForecast;
  questionType: QuestionType;
  rangeMin: number | null;
  rangeMax: number | null;
  zeroPoint: number | null;
};

const NumericChartCard: FC<Props> = ({
  forecast,
  questionType,
  rangeMin,
  rangeMax,
  zeroPoint,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const [isChartReady, setIsChartReady] = useState(false);

  const [cursorTimestamp, setCursorTimestamp] = useState(
    forecast.timestamps[forecast.timestamps.length - 1]
  );
  const cursorData = useMemo(() => {
    const index = forecast.timestamps.findIndex(
      (timestamp) => timestamp === cursorTimestamp
    );

    return {
      q1: forecast.q1s[index],
      q3: forecast.q3s[index],
      median: forecast.medians[index],
      forecastersNr: forecast.nr_forecasters[index],
      timestamp: forecast.timestamps[index],
    };
  }, [
    cursorTimestamp,
    forecast.nr_forecasters,
    forecast.timestamps,
    forecast.q3s,
    forecast.medians,
    forecast.q1s,
  ]);

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
        dataset={forecast}
        onCursorChange={handleCursorChange}
        yLabel={t("communityPredictionLabel")}
        onChartReady={handleChartReady}
        questionType={questionType}
        rangeMin={rangeMin}
        rangeMax={rangeMax}
        zeroPoint={zeroPoint}
        defaultZoom={
          user ? TimelineChartZoomOption.All : TimelineChartZoomOption.TwoMonths
        }
        withZoomPicker
      />

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 dark:text-white xs:gap-x-8 sm:mx-8 sm:gap-x-4 sm:gap-y-0">
        <CursorDetailItem
          title={t("totalForecastersLabel")}
          text={cursorData.forecastersNr.toString()}
        />
        <CursorDetailItem
          title={t("communityPredictionLabel")}
          text={getDisplayValue(cursorData.median, questionType, rangeMin, rangeMax, zeroPoint)}
          variant="prediction"
        />
      </div>
    </div>
  );
};

export default NumericChartCard;
