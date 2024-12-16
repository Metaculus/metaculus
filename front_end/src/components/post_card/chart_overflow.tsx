import { useTranslations } from "next-intl";
import React, { FC } from "react";

import ChartOverflowContainer from "@/components/charts/cp_reveal_time_overflow";
import CPRevealTime from "@/components/cp_reveal_time";
import { ForecastAvailability } from "@/types/question";

type Props = {
  forecastAvailability?: ForecastAvailability;
  className?: string;
  textClassName?: string;
};

const ForecastAvailabilityChartOverflow: FC<Props> = ({
  forecastAvailability,
  className,
  textClassName,
}) => {
  const t = useTranslations();

  if (!forecastAvailability) {
    return null;
  }

  if (!!forecastAvailability?.cpRevealsOn) {
    return (
      <ChartOverflowContainer
        className={className}
        textClassName={textClassName}
      >
        <CPRevealTime cpRevealTime={forecastAvailability.cpRevealsOn} />
      </ChartOverflowContainer>
    );
  }

  if (forecastAvailability.isEmpty) {
    return (
      <ChartOverflowContainer
        className={className}
        textClassName={textClassName}
      >
        <span>{t("noForecastsYet")}</span>
      </ChartOverflowContainer>
    );
  }

  return null;
};

export default ForecastAvailabilityChartOverflow;
