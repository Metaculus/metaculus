import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  formatedResolution: string;
  successfullyResolved: boolean;
  unit?: string;
  presentation?: "forecasterView" | "consumerView";
};

const QuestionResolutionChip: FC<Props> = ({
  formatedResolution,
  successfullyResolved,
  unit,
  presentation = "forecasterView",
}) => {
  const t = useTranslations();
  return (
    <div className="flex justify-center">
      <div
        className={cn(
          "flex w-fit flex-col items-center rounded-[10px] border border-purple-500 px-4 py-2.5 dark:border-purple-500",
          {
            "border-gray-300 dark:border-gray-300-dark": !successfullyResolved,
          }
        )}
      >
        {successfullyResolved && (
          <span className="text-xs font-normal uppercase leading-4 text-purple-700 dark:text-purple-700-dark">
            {presentation === "forecasterView" ? t("resolved") : t("result")}
          </span>
        )}
        <span
          className={cn(
            "text-center text-lg font-bold leading-6 text-purple-800 dark:text-purple-800-dark",
            {
              "text-gray-700 dark:text-gray-700-dark": !successfullyResolved,
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

export default QuestionResolutionChip;
