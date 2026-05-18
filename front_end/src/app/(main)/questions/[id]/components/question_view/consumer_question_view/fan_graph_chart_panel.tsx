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

type ChartView = "fan" | "timeline";

type Props = {
  post: GroupOfQuestionsPost<QuestionWithNumericForecasts>;
  preselectedQuestionId?: number;
  visibleQuestions?: QuestionWithNumericForecasts[];
};

const FanGraphChartPanel: FC<Props> = ({
  post,
  preselectedQuestionId,
  visibleQuestions,
}) => {
  const t = useTranslations();
  const { hideCP } = useHideCP();
  const [activeView, setActiveView] = useState<ChartView>("fan");

  const views: { value: ChartView; label: string }[] = [
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

  return (
    <div className="grid grid-cols-1 grid-rows-1">
      <div
        className={cn(
          "col-start-1 row-start-1",
          activeView !== "fan" && "pointer-events-none invisible"
        )}
      >
        <div className="mb-2 pl-2">{toggle}</div>
        <FanChart
          group={post.group_of_questions}
          hideCP={hideCP}
          withTooltip
          height={isCompact ? 150 : undefined}
        />
      </div>
      <div
        className={cn(
          "relative col-start-1 row-start-1",
          activeView !== "timeline" && "pointer-events-none invisible"
        )}
      >
        <div className="absolute left-2 top-0 z-10">{toggle}</div>
        <ConsumerGroupChart
          post={post}
          preselectedQuestionId={preselectedQuestionId}
          chartHeight={isCompact ? 150 : 220}
          visibleQuestions={visibleQuestions}
        />
      </div>
    </div>
  );
};

export default FanGraphChartPanel;
