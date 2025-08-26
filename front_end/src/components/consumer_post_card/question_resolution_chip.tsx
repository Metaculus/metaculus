import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import { QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { formatResolution } from "@/utils/formatters/resolution";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  formatedResolution: string;
  successfullyResolved: boolean;
  unit?: string;
  presentation?: "forecasterView" | "consumerView";
  size?: "md" | "lg";
  className?: string;
};

const QuestionResolutionChip: FC<Props> = ({
  formatedResolution,
  successfullyResolved,
  unit,
  className,
  presentation = "forecasterView",
  size = "md",
}) => {
  const t = useTranslations();
  return (
    <div className={cn("flex justify-center", className)}>
      <div
        className={cn(
          "flex w-fit flex-col items-center rounded-[10px] border border-purple-500 px-4 py-2.5 dark:border-purple-500",
          {
            "border-gray-300 dark:border-gray-300-dark": !successfullyResolved,
            "px-5 py-3": size === "lg",
          }
        )}
      >
        {successfullyResolved && (
          <span
            className={cn(
              "text-xs font-normal uppercase leading-4 text-purple-700 dark:text-purple-700-dark",
              {
                "text-base": size === "lg",
              }
            )}
          >
            {presentation === "forecasterView" ? t("resolved") : t("result")}
          </span>
        )}
        <span
          className={cn(
            "text-center text-base font-bold leading-6 text-purple-800 dark:text-purple-800-dark",
            {
              "text-gray-700 dark:text-gray-700-dark": !successfullyResolved,
              "text-lg": size === "lg",
            }
          )}
        >
          <span>
            {unit ? formatedResolution.replace(unit, "") : formatedResolution}
          </span>
          {successfullyResolved && unit && (
            <span className="font-normal">{unit}</span>
          )}
        </span>
      </div>
    </div>
  );
};

export const QuestionResolutionChipFacade: FC<{
  question: QuestionWithNumericForecasts;
  size?: "md" | "lg";
  className?: string;
}> = ({ question, className, size = "md" }) => {
  const locale = useLocale();
  const formatedResolution = formatResolution({
    resolution: question.resolution,
    questionType: question.type,
    scaling: question.scaling,
    locale,
    unit: question.unit,
    actual_resolve_time: question.actual_resolve_time ?? null,
    completeBounds: true,
    longBounds: true,
  });
  const successfullyResolved = isSuccessfullyResolved(question.resolution);
  return (
    <QuestionResolutionChip
      formatedResolution={formatedResolution}
      successfullyResolved={successfullyResolved}
      unit={question.unit}
      size={size}
      className={className}
    />
  );
};

export default QuestionResolutionChip;
