"use client";

import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import FanChart from "@/components/charts/fan_chart";
import Button from "@/components/ui/button";
import { useHideCP } from "@/contexts/cp_context";
import { GroupOfQuestionsPost } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";

import ConsumerGroupChart from "./consumer_group_chart";
import { useListChartExpanded } from "./consumer_list_chart_shell";

type ChartView = "fan" | "timeline";

const TOGGLE_ROW_HEIGHT = 32;

type Props = {
  post: GroupOfQuestionsPost<QuestionWithNumericForecasts>;
  preselectedQuestionId?: number;
  visibleQuestions?: QuestionWithNumericForecasts[];
  variant?: "consumer" | "forecaster";
};

const FanGraphChartPanel: FC<Props> = ({
  post,
  preselectedQuestionId,
  visibleQuestions,
  variant = "forecaster",
}) => {
  const t = useTranslations();
  const { hideCP } = useHideCP();
  const { chartAreaHeight } = useListChartExpanded();
  const isConsumer = variant === "consumer";
  const [activeView, setActiveView] = useState<ChartView>(
    isConsumer ? "timeline" : "fan"
  );

  const views: { value: ChartView; label: string }[] = isConsumer
    ? [
        { value: "timeline", label: t("timeline") },
        { value: "fan", label: t("fanChart") },
      ]
    : [
        { value: "fan", label: t("fanChart") },
        { value: "timeline", label: t("timeline") },
      ];

  const isCompact = !!visibleQuestions;

  const toggle = (
    <div className="flex gap-2">
      {views.map(({ value, label }) => (
        <Button
          key={value}
          onClick={() => setActiveView(value)}
          className={cn(
            "h-6 rounded border-0 px-1 py-0.5 text-sm font-normal leading-4",
            activeView === value
              ? "bg-blue-200 text-blue-800 hover:text-blue-800 active:text-blue-800 dark:bg-blue-200-dark dark:text-blue-800-dark"
              : "text-gray-500 hover:text-gray-500 active:text-gray-500 dark:text-gray-500-dark"
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  );
  const fanChartHeight =
    chartAreaHeight > 0
      ? Math.max(100, chartAreaHeight - TOGGLE_ROW_HEIGHT)
      : isCompact
        ? 150
        : undefined;

  return (
    <div>
      <div className="mb-2">{toggle}</div>
      <div className="grid grid-cols-1 grid-rows-1">
        <div
          className={cn(
            "col-start-1 row-start-1",
            activeView !== "fan" && "pointer-events-none invisible"
          )}
        >
          <FanChart
            group={post.group_of_questions}
            hideCP={hideCP}
            withTooltip
            height={fanChartHeight}
            alignPlotLeft
          />
        </div>
        <div
          className={cn(
            "col-start-1 row-start-1",
            activeView !== "timeline" && "pointer-events-none invisible"
          )}
        >
          <ConsumerGroupChart
            post={post}
            preselectedQuestionId={preselectedQuestionId}
            chartHeight={isCompact ? 150 : 220}
            visibleQuestions={visibleQuestions}
            reservedHeight={TOGGLE_ROW_HEIGHT}
          />
        </div>
      </div>
    </div>
  );
};

export default FanGraphChartPanel;
