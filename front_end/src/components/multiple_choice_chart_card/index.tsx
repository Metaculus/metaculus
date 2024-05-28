"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import { MultipleChoiceDataset } from "@/types/charts";

type Props = {
  dataset: MultipleChoiceDataset;
};

const MultipleChoiceChartCard: FC<Props> = ({ dataset }) => {
  const t = useTranslations();

  const [isChartReady, setIsChartReady] = useState(false);

  const [activeTimestamp, setActiveTimestamp] = useState(
    dataset.timestamps[dataset.timestamps.length - 1]
  );
  const cursorData = useMemo(() => {
    const index = dataset.timestamps.findIndex(
      (timestamp) => timestamp === activeTimestamp
    );

    return {
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
    <div
      className={classNames(
        "flex flex-col w-full",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="flex items-center">
        <h3 className="m-0 text-base font-normal leading-5">
          {t("forecastTimelineHeading")}
        </h3>
        <div className="ml-auto">
          {t("totalForecastersLabel")}{" "}
          <strong>{cursorData.forecastersNr}</strong>
        </div>
      </div>
      <MultipleChoiceChart
        dataset={dataset}
        yLabel={t("communityPredictionLabel")}
        onChartReady={handleChartReady}
        onCursorChange={handleCursorChange}
      />
    </div>
  );
};

export default MultipleChoiceChartCard;
