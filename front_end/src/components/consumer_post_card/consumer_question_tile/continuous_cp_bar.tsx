import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import UpcomingCP from "@/components/consumer_post_card/upcoming_cp";
import { ForecastAvailability } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  communityPredictionDisplayValue: string | null;
  isClosed: boolean;
  forecastAvailability: ForecastAvailability;
  variant?: "feed" | "question";
};

const ContinuousCPBar: FC<Props> = ({
  communityPredictionDisplayValue,
  isClosed,
  forecastAvailability,
  variant = "feed",
}) => {
  const t = useTranslations();

  return (
    <div className="flex min-w-[200px] max-w-[200px] flex-col justify-center gap-1 text-center">
      <div
        className={cn("text-olive-700 dark:text-olive-700-dark", {
          "text-gray-600 dark:text-gray-600-dark": isClosed,
          // Small fonts for feed tiles
          "text-xs md:text-sm": variant === "feed",
          // Larger fonts for question pages
          "text-sm md:text-base": variant === "question",
        })}
      >
        {isClosed ? t("latestEstimate") : t("currentEstimate")}
      </div>
      <div
        className={cn("font-bold text-olive-900 dark:text-olive-900-dark", {
          "text-gray-700 dark:text-gray-700-dark": isClosed,
          // Small fonts for feed tiles
          "text-lg": variant === "feed",
          // Large fonts for question pages
          "text-xl md:text-2xl": variant === "question",
        })}
      >
        {!isNil(forecastAvailability?.cpRevealsOn) && (
          <UpcomingCP cpRevealsOn={forecastAvailability.cpRevealsOn} />
        )}
        {communityPredictionDisplayValue}
      </div>
    </div>
  );
};

export default ContinuousCPBar;
