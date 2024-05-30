"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import CursorDetailItem from "@/components/detailed_question_card/numeric_chart_card/numeric_cursor_item";
import { NumericForecast } from "@/types/question";

type Props = {
  forecast: NumericForecast;
};

const NumericChartCard: FC<Props> = ({ forecast }) => {
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
      min: forecast.values_min[index].toFixed(1),
      max: forecast.values_max[index].toFixed(1),
      mean: forecast.values_mean[index].toFixed(1),
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
      />

      <div className="my-3 grid grid-cols-2 gap-x-4 gap-y-2 xs:gap-x-8 sm:mx-8 sm:gap-x-4 sm:gap-y-0">
        <CursorDetailItem
          title={t("totalForecastersLabel")}
          text={cursorData.forecastersNr.toString()}
        />
        <CursorDetailItem
          title={t("communityPredictionLabel")}
          text={`${cursorData.mean} (${cursorData.min} - ${cursorData.max})`}
          variant="prediction"
        />
      </div>
    </div>
  );
};

export default NumericChartCard;
