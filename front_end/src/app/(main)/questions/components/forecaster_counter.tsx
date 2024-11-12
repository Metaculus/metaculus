import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC } from "react";

type Props = {
  forecasters?: number;
  className?: string;
};

const ForecastersCounter: FC<Props> = ({ forecasters, className }) => {
  const t = useTranslations();
  if (!forecasters) {
    return null;
  }
  return (
    <div
      className={classNames(
        "text-xs text-gray-600-dark dark:text-gray-600-dark",
        className
      )}
    >
      {forecasters} {t("forecastersWithCount", { count: forecasters })}
    </div>
  );
};

export default ForecastersCounter;
