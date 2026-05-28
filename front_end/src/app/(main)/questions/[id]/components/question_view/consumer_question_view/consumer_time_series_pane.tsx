"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import TimeSeriesChart from "@/components/consumer_post_card/time_series_chart";
import { QuestionWithNumericForecasts } from "@/types/question";

import { useListChartExpanded } from "./consumer_list_chart_shell";

type Props = {
  questions: QuestionWithNumericForecasts[];
  height?: number;
};

const ConsumerTimeSeriesPane: FC<Props> = ({ questions, height = 180 }) => {
  const t = useTranslations();
  const { hoveredChoiceName, setHoveredChoiceName } = useListChartExpanded();

  return (
    <div className="flex flex-col">
      <span className="text-sm font-normal leading-4 text-gray-500 dark:text-gray-500-dark">
        {t("forecasts")}
      </span>
      <TimeSeriesChart
        questions={questions}
        variant="colorful"
        height={height}
        hoveredBarLabel={hoveredChoiceName}
        onBarHover={setHoveredChoiceName}
      />
    </div>
  );
};

export default ConsumerTimeSeriesPane;
