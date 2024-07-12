import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { FC } from "react";

import { ForecastType } from "@/types/comment";
import { formatDate } from "@/utils/date_formatters";

type Props = {
  author: string;
  forecast: ForecastType;
};

function formatForecastValue(forecast: ForecastType) {
  if (forecast.probability_yes) {
    return forecast.probability_yes;
  }
  if (forecast.probability_yes_per_category) {
    return "TBD";
  }
  if (forecast.continuous_cdf) {
    return "TBD";
  }
}

const IncludedForecast: FC<Props> = ({ author, forecast }) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="left-5 top-5 order-none my-2 box-border flex w-fit min-w-[270px] flex-none grow-0 flex-col items-start gap-2 rounded border border-blue-500 bg-blue-300 p-3 text-xs dark:border-blue-500-dark dark:bg-blue-300-dark">
      <div>
        {t.rich("namesPrediction", {
          name: (username) => <span className="font-bold">{username}</span>,
          username: author,
        })}
      </div>
      <div className="order-1 grow-0 text-xl font-bold text-gray-900 dark:text-gray-900-dark">
        {formatForecastValue(forecast)}
      </div>
      <div className="order-1 grow-0 text-gray-600 dark:text-gray-600-dark">
        {formatDate(locale, forecast.start_time)}
      </div>
    </div>
  );
};

export default IncludedForecast;
