"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import { NumericForecast, QuestionType } from "@/types/question";
import { getNumericChartTypeFromQuestion } from "@/utils/charts";
import { formatPrediction } from "@/utils/forecasts";

import CursorDetailItem from "./numeric_cursor_item";

type Props = {
  forecast: NumericForecast;
  questionType: QuestionType;
};

const NumericChartCard: FC<Props> = ({ forecast, questionType }) => {
  const t = useTranslations();

  const [isChartReady, setIsChartReady] = useState(false);

  const [cursorTimestamp, setCursorTimestamp] = useState(
    forecast.timestamps[forecast.timestamps.length - 1]
  );
  const cursorData = useMemo(() => {
    const index = forecast.timestamps.findIndex(
      (timestamp) => timestamp === cursorTimestamp
    );

    return {
      min: forecast.values_min[index],
      max: forecast.values_max[index],
      mean: forecast.values_mean[index],
      forecastersNr: forecast.nr_forecasters[index],
      timestamp: forecast.timestamps[index],
    };
  }, [
    cursorTimestamp,
    forecast.nr_forecasters,
    forecast.timestamps,
    forecast.values_max,
    forecast.values_mean,
    forecast.values_min,
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
        type={getNumericChartTypeFromQuestion(questionType)}
      />

      <div className="my-3 grid grid-cols-2 gap-x-4 gap-y-2 dark:text-white xs:gap-x-8 sm:mx-8 sm:gap-x-4 sm:gap-y-0">
        <CursorDetailItem
          title={t("totalForecastersLabel")}
          text={cursorData.forecastersNr.toString()}
        />
        <CursorDetailItem
          title={t("communityPredictionLabel")}
          text={formatPrediction(cursorData.mean, questionType)}
          variant="prediction"
        />
      </div>
    </div>
  );
};

export default NumericChartCard;
