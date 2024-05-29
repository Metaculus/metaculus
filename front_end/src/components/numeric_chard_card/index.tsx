"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import CursorDetailItem from "@/components/numeric_chard_card/numeric_cursor_item";
import { NumericForecast } from "@/types/question";

type Props = {
  dataset: NumericForecast;
};

const NumericChartCard: FC<Props> = ({ dataset }) => {
  const t = useTranslations();

  const [isChartReady, setIsChartReady] = useState(false);

  const [cursorTimestamp, setCursorTimestamp] = useState(
    dataset.timestamps[dataset.timestamps.length - 1]
  );
  const cursorData = useMemo(() => {
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
  }, [cursorTimestamp, dataset]);

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
        dataset={dataset}
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
