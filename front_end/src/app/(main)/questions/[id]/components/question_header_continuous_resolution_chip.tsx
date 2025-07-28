import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  formatedResolution: string;
  successfullyResolved: boolean;
  size?: "md" | "lg";
};

const QuestionHeaderContinuousResolutionChip: FC<Props> = ({
  formatedResolution,
  successfullyResolved,
  size = "md",
}) => {
  const t = useTranslations();
  return (
    <div
      className={cn("flex w-max justify-center", {
        "max-w-[200px] gap-4": size === "lg",
        "max-w-[130px]": size === "md",
      })}
    >
      <div
        className={cn(
          "flex w-fit flex-col items-center rounded-[10px] border border-purple-500 px-4 py-2.5 dark:border-purple-500",
          {
            "border-gray-300 dark:border-gray-300-dark": !successfullyResolved,
            "gap-1 px-5 py-3": size === "lg",
          }
        )}
      >
        {successfullyResolved && (
          <span
            className={cn("font-normal text-gray-700 dark:text-gray-700-dark", {
              "text-[10px] leading-[14px]": size === "md",
              "text-sm leading-4": size === "lg",
            })}
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
        {
          // TODO: @ncarazon add mini-graph here
        }
      </div>
    </div>
  );
};

export default QuestionHeaderContinuousResolutionChip;
