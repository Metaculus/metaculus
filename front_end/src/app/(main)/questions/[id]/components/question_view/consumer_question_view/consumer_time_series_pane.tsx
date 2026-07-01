"use client";

import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo } from "react";

import TimeSeriesChart from "@/components/consumer_post_card/time_series_chart";
import { QuestionWithNumericForecasts } from "@/types/question";

import { useListChartExpanded } from "./consumer_list_chart_shell";

type Props = {
  questions: QuestionWithNumericForecasts[];
  height?: number;
};

const ConsumerTimeSeriesPane: FC<Props> = ({ questions, height = 180 }) => {
  const t = useTranslations();
  const {
    hoveredChoiceName,
    setHoveredChoiceName,
    viewMode,
    setViewMode,
    selectedQuestionId,
    setSelectedQuestionId,
  } = useListChartExpanded();
  const isDistributions = viewMode === "distributions";

  const selectedBarLabel = useMemo(() => {
    if (!isDistributions || selectedQuestionId == null) return null;
    return questions.find((q) => q.id === selectedQuestionId)?.label ?? null;
  }, [isDistributions, selectedQuestionId, questions]);

  // Clicking a bin activates its distribution and switches into that mode.
  const handleBarClick = useCallback(
    (label: string) => {
      const question = questions.find((q) => q.label === label);
      if (question?.id != null) {
        setSelectedQuestionId(question.id);
        setViewMode("distributions");
      }
    },
    [questions, setSelectedQuestionId, setViewMode]
  );

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
        selectedBarLabel={selectedBarLabel}
        onBarClick={handleBarClick}
      />
    </div>
  );
};

export default ConsumerTimeSeriesPane;
