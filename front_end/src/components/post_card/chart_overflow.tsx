import React, { FC } from "react";

import ChartOverflowContainer from "@/components/charts/cp_reveal_time_overflow";
import CPRevealTime from "@/components/cp_reveal_time";
import { ForecastAvailability } from "@/types/question";

type Props = {
  forecastAvailability?: ForecastAvailability;
  className?: string;
  textClassName?: string;
  style?: React.CSSProperties;
};

const ForecastAvailabilityChartOverflow: FC<Props> = ({
  forecastAvailability,
  className,
  textClassName,
  style,
}) => {
  if (!forecastAvailability) {
    return null;
  }

  if (!!forecastAvailability?.cpRevealsOn) {
    return (
      <ChartOverflowContainer
        className={className}
        textClassName={textClassName}
        style={style}
      >
        <CPRevealTime cpRevealTime={forecastAvailability.cpRevealsOn} />
      </ChartOverflowContainer>
    );
  }

  return null;
};

export default ForecastAvailabilityChartOverflow;
