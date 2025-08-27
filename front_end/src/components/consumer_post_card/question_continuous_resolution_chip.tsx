import { useTranslations } from "next-intl";
import React, { FC } from "react";

import ContinuousForecastIcon from "@/components/icons/continuous_forecast";
import ResolutionIcon from "@/components/icons/resolution";
import cn from "@/utils/core/cn";

type Props = {
  formatedResolution: string;
  formattedCP: string | null;
};

const QuestionContinuousResolutionChip: FC<Props> = ({
  formatedResolution,
  formattedCP,
}) => {
  const t = useTranslations();
  return (
    <div className="embed-gap flex max-w-[250px] flex-col gap-1.5">
      <div
        className={cn(
          "flex h-auto flex-row items-center self-stretch text-gray-900 dark:text-gray-900-dark"
        )}
      >
        <div className="pr-2">
          <ContinuousForecastIcon className="w-5" />
        </div>

        <div className="resize-label line-clamp-2 w-full pr-1.5 text-left text-xs font-normal capitalize text-olive-800 dark:text-olive-800-dark md:text-sm">
          {t("community")}
        </div>
        <div className="resize-label whitespace-pre pl-7 text-right text-sm font-bold text-olive-900 dark:text-olive-900-dark md:text-base">
          {formattedCP}
        </div>
      </div>
      <div
        className={cn(
          "flex h-auto flex-row items-center self-stretch text-gray-900 dark:text-gray-900-dark"
        )}
      >
        <div className="pr-2">
          <ResolutionIcon
            className="w-5 text-purple-800 dark:text-purple-800-dark"
            variant="bold"
          />
        </div>

        <div className="resize-label line-clamp-2 w-full pr-1.5 text-left text-xs font-normal capitalize text-purple-800 dark:text-purple-800-dark md:text-sm">
          {t("result")}
        </div>
        <div className="resize-label whitespace-pre pl-7 text-right text-sm font-bold text-purple-800 dark:text-purple-800-dark md:text-base">
          {formatedResolution}
        </div>
      </div>
    </div>
  );
};

export default QuestionContinuousResolutionChip;
