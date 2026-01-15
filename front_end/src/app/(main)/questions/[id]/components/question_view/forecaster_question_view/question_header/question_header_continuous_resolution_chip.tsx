import { useTranslations } from "next-intl";
import { FC } from "react";

import { useIsEmbedMode } from "@/app/(embed)/questions/components/question_view_mode_context";
import { getContinuousAreaChartData } from "@/components/charts/continuous_area_chart";
import MinifiedContinuousAreaChart from "@/components/charts/minified_continuous_area_chart";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  formatedResolution: string;
  successfullyResolved: boolean;
  size?: "md" | "lg";
  question: QuestionWithNumericForecasts;
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

  const isEmbed = useIsEmbedMode();

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
            "mb-0 truncate text-sm md:text-sm": isEmbed,
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
