"use client";
import { FC, useCallback, useMemo, useState } from "react";

import NumericChart from "@/components/numeric_chart";
import { generateMockNumericChart } from "@/utils/mock_charts";

const NUMERIC_DATASET = generateMockNumericChart();

const NumericChartCard: FC = () => {
  const [activeTimestamp, setActiveTimestamp] = useState(
    NUMERIC_DATASET.timestamps[NUMERIC_DATASET.timestamps.length - 1]
  );
  const cursorData = useMemo(() => {
    const index = NUMERIC_DATASET.timestamps.findIndex(
      (timestamp) => timestamp === activeTimestamp
    );

    return {
      min: NUMERIC_DATASET.values_min[index],
      max: NUMERIC_DATASET.values_max[index],
      mean: NUMERIC_DATASET.values_mean[index],
      forecastersNr: NUMERIC_DATASET.nr_forecasters[index],
      timestamp: NUMERIC_DATASET.timestamps[index],
    };
  }, [activeTimestamp]);

  const handleCursorChange = useCallback((value: number) => {
    setActiveTimestamp(value);
  }, []);

  return (
    <div className="flex flex-col w-full max-w-[760px]">
      <NumericChart
        dataset={NUMERIC_DATASET}
        onCursorChange={handleCursorChange}
      />
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <span>Total Forecasters</span>
          <span>{cursorData.forecastersNr}</span>
        </div>
        <div className="flex flex-col">
          <span>Community Prediction</span>
          <span>{`${cursorData.mean} (${cursorData.min} - ${cursorData.max})`}</span>
        </div>
      </div>
    </div>
  );
};

export default NumericChartCard;
