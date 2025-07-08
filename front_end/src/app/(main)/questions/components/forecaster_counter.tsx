import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import { abbreviatedNumber } from "@/utils/formatters/number";

type Props = {
  forecasters?: number;
};

const ForecastersCounter: FC<Props> = ({ forecasters }) => {
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
    <div className="flex flex-row items-center gap-1.5 truncate px-1.5 text-xs font-normal text-gray-700 dark:text-gray-700-dark md:gap-2">
      <FontAwesomeIcon
        icon={faUsers}
        className="text-gray-400 dark:text-gray-400-dark"
      />
      {/* Large screens version */}
      <span className="hidden align-middle md:block">
        {t("forecastersWithCount", {
          count: forecasters,
          count_formatted: forecastersFormatted,
        })}
      </span>
      {/* Small screens version */}
      <span className="block align-middle md:hidden">
        {forecastersFormatted}
      </span>
    </div>
  );
};

export default ForecastersCounter;
