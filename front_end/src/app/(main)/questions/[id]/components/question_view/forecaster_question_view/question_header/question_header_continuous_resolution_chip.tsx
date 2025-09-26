import { useTranslations } from "next-intl";
import { FC } from "react";

import { getContinuousAreaChartData } from "@/components/charts/continuous_area_chart";
import MinifiedContinuousAreaChart from "@/components/charts/minified_continuous_area_chart";
import { QuestionStatus } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  formatedResolution: string;
  successfullyResolved: boolean;
  size?: "md" | "lg";
  question: QuestionWithForecasts;
};

const QuestionHeaderContinuousResolutionChip: FC<Props> = ({
  formatedResolution,
  successfullyResolved,
  size = "md",
  question,
}) => {
  const t = useTranslations();
  const continuousAreaChartData = getContinuousAreaChartData({
    question,
    isClosed: question.status === QuestionStatus.CLOSED,
  });

  return (
    <div
      className={cn(
        "flex min-w-[110px] flex-col rounded-[10px] border border-purple-500 p-2 dark:border-purple-500 md:px-3 md:py-2.5",
        {
          "border-gray-300 dark:border-gray-300-dark": !successfullyResolved,
          "w-[200px]": size === "lg",
          "max-w-[130px]": size === "md",
          "gap-1 px-5 py-3": size === "lg",
        }
      )}
    >
      {successfullyResolved && (
        <span
          className={cn(
            "text-center font-normal text-gray-700 dark:text-gray-700-dark",
            {
              "text-[10px] leading-[14px]": size === "md",
              "text-sm leading-4": size === "lg",
            }
          )}
        >
          {t("resolved")}
        </span>
      )}
      <span
        className={cn(
          "text-center text-sm font-bold leading-6 text-purple-800 dark:text-purple-800-dark",
          {
            "text-gray-700 dark:text-gray-700-dark": !successfullyResolved,
            "text-base": size === "lg",
          }
        )}
      >
        {formatedResolution}
      </span>
      <MinifiedContinuousAreaChart
        question={question}
        data={continuousAreaChartData}
        height={size === "lg" ? 120 : 50}
        forceTickCount={2}
        hideLabels={size === "md"}
      />
    </div>
  );
};

export default QuestionHeaderContinuousResolutionChip;
