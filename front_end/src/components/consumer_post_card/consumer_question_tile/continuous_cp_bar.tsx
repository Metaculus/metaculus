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
};

const ContinuousCPBar: FC<Props> = ({
  communityPredictionDisplayValue,
  isClosed,
  forecastAvailability,
}) => {
  const t = useTranslations();

  return (
    <div className="flex min-w-[200px] max-w-[200px] flex-col justify-center text-center">
      <div
        className={cn("text-xs text-olive-700 dark:text-olive-700-dark", {
          "text-gray-600 dark:text-gray-600-dark": isClosed,
        })}
      >
        {isClosed ? t("latestEstimate") : t("currentEstimate")}
      </div>
      <div
        className={cn(
          "text-lg font-bold text-olive-900 dark:text-olive-900-dark",
          {
            "text-gray-700 dark:text-gray-700-dark": isClosed,
          }
        )}
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
