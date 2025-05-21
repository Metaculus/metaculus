import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  formatedResolution: string;
  successfullyResolved: boolean;
  unit?: string;
};

const QuestionResolutionChip: FC<Props> = ({
  formatedResolution,
  successfullyResolved,
  unit,
}) => {
  const t = useTranslations();
  return (
    <div className="flex min-w-[200px] max-w-[200px] justify-center">
      <div
        className={cn(
          "flex w-fit flex-col items-center rounded bg-purple-100 px-4 py-2 dark:bg-purple-100-dark",
          {
            "bg-gray-300 dark:bg-gray-300-dark": !successfullyResolved,
          }
        )}
      >
        {successfullyResolved && (
          <span className="text-xs font-medium uppercase leading-4 text-purple-600 dark:text-purple-600-dark">
            {t("result")}
          </span>
        )}
        <span
          className={cn(
            "text-center text-base font-bold leading-6 text-purple-800 dark:text-purple-800-dark",
            {
              "text-gray-700 dark:text-gray-700-dark": !successfullyResolved,
            }
          )}
        >
          <span>
            {unit ? formatedResolution.replace(unit, "") : formatedResolution}
          </span>
          {unit && <span className="font-normal">{unit}</span>}
        </span>
      </div>
    </div>
  );
};

export default QuestionResolutionChip;
