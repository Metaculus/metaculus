import classNames from "classnames";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { FC, useState } from "react";

import ChoiceIcon from "@/components/choice_icon";
import Button from "@/components/ui/button";
import { MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { ForecastType } from "@/types/comment";
import { formatDate } from "@/utils/date_formatters";
import { abbreviatedNumber } from "@/utils/number_formatters";

type Props = {
  author: string;
  forecast: ForecastType;
};

type ForecastValueProps = {
  forecast: ForecastType;
};

const ForecastValue: FC<ForecastValueProps> = ({ forecast }) => {
  const t = useTranslations();
  const locale = useLocale();

  const [showAll, setShowAll] = useState(false);

  if (forecast.question_type == "binary") {
    return (
      <div className="order-1 grow-0 text-xl font-bold text-gray-900 dark:text-gray-900-dark">
        {`${Math.round(forecast.probability_yes * 1000) / 10}%`}
      </div>
    );
  }
  if (forecast.question_type == "multiple_choice") {
    const choices = forecast.probability_yes_per_category
      .map((probability, index) => ({
        probability: probability,
        name: forecast.options[index],
        color: MULTIPLE_CHOICE_COLOR_SCALE[index],
      }))
      .sort((a, b) => b.probability - a.probability);
    return (
      <ol className="order-1 grow-0 text-xl font-bold text-gray-900 dark:text-gray-900-dark">
        {choices.map((choice, index) => (
          <li
            className={classNames("flex items-center gap-2 pr-2", {
              hidden: !showAll && index > 1,
            })}
            key={index}
          >
            {/* TODO: why does this generate a slightly different color than in ForecastChoiceOption ? */}
            <ChoiceIcon color={choice.color} />
            {`${choice.name}: ${Math.round(choice.probability * 1000) / 10}%`}
          </li>
        ))}
        <Button
          size="lg"
          variant="text"
          className="!py-0"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? t("closeFullForecast") : t("showFullForecast")}
        </Button>
      </ol>
    );
  }
  if (forecast.question_type == "date") {
    return (
      <div className="order-1 grow-0 text-xl font-bold text-gray-900 dark:text-gray-900-dark" suppressHydrationWarning>
        {`${formatDate(locale, new Date(forecast.quartiles[1] * 1000))} (${formatDate(locale, new Date(forecast.quartiles[0] * 1000))} - ${formatDate(locale, new Date(forecast.quartiles[2] * 1000))})`}
      </div>
    );
  }
  if (forecast.question_type == "numeric") {
    return (
      <div className="order-1 grow-0 text-xl font-bold text-gray-900 dark:text-gray-900-dark">
        {`${abbreviatedNumber(forecast.quartiles[1])} (${abbreviatedNumber(forecast.quartiles[0])} - ${abbreviatedNumber(forecast.quartiles[2])})`}
      </div>
    );
  }
};

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
      <ForecastValue forecast={forecast} />
      <div className="order-1 grow-0 text-gray-600 dark:text-gray-600-dark" suppressHydrationWarning>
        {formatDate(locale, forecast.start_time)}
      </div>
    </div>
  );
};

export default IncludedForecast;
