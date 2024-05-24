"use client";
import classNames from "classnames";
import { FC, useCallback, useMemo, useState } from "react";

import CursorDetails from "@/components/cursor_details";
import NumericChart from "@/components/numeric_chart";
import { NumericChartDataset } from "@/types/charts";

type Props = {
  dataset: NumericChartDataset;
};

const NumericChartCard: FC<Props> = ({ dataset }) => {
  const [isChartReady, setIsChartReady] = useState(false);

  const [activeTimestamp, setActiveTimestamp] = useState(
    dataset.timestamps[dataset.timestamps.length - 1]
  );
  const cursorData = useMemo(() => {
    const index = dataset.timestamps.findIndex(
      (timestamp) => timestamp === activeTimestamp
    );

    return {
      min: dataset.values_min[index].toFixed(1),
      max: dataset.values_max[index].toFixed(1),
      mean: dataset.values_mean[index].toFixed(1),
      forecastersNr: dataset.nr_forecasters[index],
      timestamp: dataset.timestamps[index],
    };
  }, [activeTimestamp, dataset]);

  const handleCursorChange = useCallback((value: number) => {
    setActiveTimestamp(value);
  }, []);

  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  return (
    <div className="flex flex-col w-full">
      <NumericChart
        dataset={dataset}
        onCursorChange={handleCursorChange}
        yLabel={"Community Prediction"}
        onChartReady={handleChartReady}
      />
      <div className={classNames(isChartReady ? "opacity-100" : "opacity-0")}>
        <CursorDetails
          forecastersNr={cursorData.forecastersNr}
          min={cursorData.min}
          mean={cursorData.mean}
          max={cursorData.max}
        />
      </div>
    </div>
  );
};

export default NumericChartCard;
