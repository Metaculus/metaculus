import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import cn from "@/utils/core/cn";
import { abbreviatedNumber } from "@/utils/formatters/number";

type Props = {
  forecasters?: number;
  compact?: boolean;
  className?: string;
};

const ForecastersCounter: FC<Props> = ({
  forecasters,
  compact = false,
  className,
}) => {
  const t = useTranslations();

  if (!forecasters) {
    return null;
  }

  const forecastersFormatted = abbreviatedNumber(
    forecasters,
    2,
    false,
    undefined,
    3
  );

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-1.5 truncate px-1.5 text-xs font-normal text-gray-700 dark:text-gray-700-dark md:gap-2",
        className
      )}
    >
      <FontAwesomeIcon
        icon={faUsers}
        className="text-gray-400 dark:text-gray-400-dark"
      />
      {/* Compact version - just shows number */}
      {compact && (
        <span className="align-middle font-medium tabular-nums">
          {forecastersFormatted}
        </span>
      )}
      {/* Full version - shows descriptive text */}
      {!compact && (
        <span className="align-middle">
          <span className="font-medium tabular-nums">
            {forecastersFormatted}
          </span>{" "}
          {forecasters === 1 ? "forecaster" : "forecasters"}
        </span>
      )}
    </div>
  );
};

export default ForecastersCounter;
