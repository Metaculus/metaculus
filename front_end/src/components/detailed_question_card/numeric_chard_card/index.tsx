"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import DetailsQuestionCardEmptyState from "@/components/detailed_question_card/empty_state";
import CursorDetailItem from "@/components/detailed_question_card/numeric_chard_card/numeric_cursor_item";
import { NumericForecast } from "@/types/question";

type Props = {
  dataset: NumericForecast;
};

const NumericChartCard: FC<Props> = ({ dataset }) => {
  const t = useTranslations();

  const isChartEmpty = useMemo(
    () => Object.values(dataset).some((value) => !value || !value.length),
    [dataset]
  );

  const [isChartReady, setIsChartReady] = useState(false);

  const [cursorTimestamp, setCursorTimestamp] = useState(
    dataset.timestamps[dataset.timestamps.length - 1]
  );
  const cursorData = useMemo(() => {
    if (isChartEmpty) {
      return null;
    }

    const index = dataset.timestamps.findIndex(
      (timestamp) => timestamp === cursorTimestamp
    );

    return {
      min: dataset.values_min[index].toFixed(1),
      max: dataset.values_max[index].toFixed(1),
      mean: dataset.values_mean[index].toFixed(1),
      forecastersNr: dataset.nr_forecasters[index],
      timestamp: dataset.timestamps[index],
    };
  }, [
    cursorTimestamp,
    dataset.nr_forecasters,
    dataset.timestamps,
    dataset.values_max,
    dataset.values_mean,
    dataset.values_min,
    isChartEmpty,
  ]);

  const handleCursorChange = useCallback((value: number) => {
    setCursorTimestamp(value);
  }, []);

  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  if (isChartEmpty) {
    return <DetailsQuestionCardEmptyState />;
  }

  return (
    <div
      className={classNames(
        "flex w-full flex-col",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      <NumericChart
        dataset={dataset}
        onCursorChange={handleCursorChange}
        yLabel={t("communityPredictionLabel")}
        onChartReady={handleChartReady}
      />

      {!!cursorData && (
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
      )}
    </div>
  );
};

export default NumericChartCard;
