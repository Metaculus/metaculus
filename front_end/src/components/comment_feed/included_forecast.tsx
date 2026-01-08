import { format } from "date-fns";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { FC, useState } from "react";

import ChoiceIcon from "@/components/choice_icon";
import Button from "@/components/ui/button";
import { MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { ForecastType } from "@/types/comment";
import { Question, QuestionType, UserForecast } from "@/types/question";
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";
import { abbreviatedNumber } from "@/utils/formatters/number";
import { getQuestionDateFormatString } from "@/utils/formatters/prediction";
import { scaleInternalLocation } from "@/utils/math";
import { formatValueUnit } from "@/utils/questions/units";

type Props = {
  author: string;
  forecast: ForecastType;
};

type ForecastValueProps = {
  forecast: ForecastType;
};

export function userForecastToForecastType(
  userForecast: UserForecast,
  question: Question
): ForecastType {
  const scaling = question.scaling;
  const questionType = question.type;

  let quartiles: [number, number, number] = [0, 0, 0];
  if (
    questionType !== QuestionType.Binary &&
    questionType !== QuestionType.MultipleChoice
  ) {
    const q1 = userForecast.interval_lower_bounds?.[0] ?? 0.25;
    const q2 = userForecast.centers?.[0] ?? 0.5;
    const q3 = userForecast.interval_upper_bounds?.[0] ?? 0.75;
    quartiles = [
      scaleInternalLocation(q1, scaling),
      scaleInternalLocation(q2, scaling),
      scaleInternalLocation(q3, scaling),
    ];
  }

  return {
    start_time: new Date(userForecast.start_time * 1000),
    probability_yes: userForecast.forecast_values[1] ?? 0,
    probability_yes_per_category: userForecast.forecast_values,
    options: question.options ?? [],
    continuous_cdf: userForecast.forecast_values,
    quartiles,
    scaling,
    question_type: questionType,
    question_unit: question.unit,
  };
}

export function formatForecastValueText(forecast: ForecastType): string {
  if (forecast.question_type === QuestionType.Binary) {
    return `${Math.round(forecast.probability_yes * 1000) / 10}%`;
  }

  if (forecast.question_type === QuestionType.MultipleChoice) {
    const choices = forecast.probability_yes_per_category
      .map((probability, index) => ({
        probability,
        name: forecast.options[index],
      }))
      .sort((a, b) => b.probability - a.probability);
    const top = choices[0];
    if (top) {
      return `${top.name}: ${Math.round(top.probability * 1000) / 10}%`;
    }
    return "";
  }

  if (forecast.quartiles.length !== 3) return "";
  const { range_min, range_max } = forecast.scaling;
  if (isNil(range_min) || isNil(range_max)) return "";

  const q1 =
    forecast.quartiles[0] <= range_min
      ? "below"
      : forecast.quartiles[0] >= range_max
        ? "above"
        : "inRange";
  const q2 =
    forecast.quartiles[1] <= range_min
      ? "below"
      : forecast.quartiles[1] >= range_max
        ? "above"
        : "inRange";
  const q3 =
    forecast.quartiles[2] <= range_min
      ? "below"
      : forecast.quartiles[2] >= range_max
        ? "above"
        : "inRange";

  const probBelow =
    Math.round((forecast.continuous_cdf.at(0) || 0) * 1000) / 10;
  const probAbove =
    Math.round((1 - (forecast.continuous_cdf.at(-1) || 0)) * 1000) / 10;
  const dateFormatString =
    forecast.question_type === QuestionType.Date
      ? getQuestionDateFormatString({
          scaling: forecast.scaling,
          actual_resolve_time: null,
          valueTimestamp: forecast.quartiles[0] * 1000,
        })
      : "";
  const valueText: string[] =
    forecast.question_type === QuestionType.Numeric ||
    forecast.question_type === QuestionType.Discrete
      ? [
          abbreviatedNumber(range_min),
          abbreviatedNumber(forecast.quartiles[0]),
          formatValueUnit(
            abbreviatedNumber(forecast.quartiles[1]),
            forecast.question_unit
          ),
          abbreviatedNumber(forecast.quartiles[2]),
          abbreviatedNumber(range_max),
        ]
      : [
          format(new Date(range_min * 1000), dateFormatString),
          format(new Date(forecast.quartiles[0] * 1000), dateFormatString),
          format(new Date(forecast.quartiles[1] * 1000), dateFormatString),
          format(new Date(forecast.quartiles[2] * 1000), dateFormatString),
          format(new Date(range_max * 1000), dateFormatString),
        ];

  if (q1 === "below" && q2 === "below" && q3 === "below") {
    return (
      probBelow +
      "% " +
      (forecast.question_type === QuestionType.Numeric ||
      forecast.question_type === QuestionType.Discrete
        ? "below "
        : "before ") +
      valueText[0]
    );
  }
  if (q1 === "below" && q2 === "below" && q3 === "inRange") {
    return (
      probBelow +
      "% " +
      (forecast.question_type === QuestionType.Numeric ||
      forecast.question_type === QuestionType.Discrete
        ? "below "
        : "before ") +
      valueText[0] +
      " (upper 75%=" +
      valueText[3] +
      ")"
    );
  }
  if (q1 === "below" && q2 === "inRange" && q3 === "inRange") {
    return (
      valueText[2] +
      " (" +
      probBelow +
      "% " +
      (forecast.question_type === QuestionType.Numeric ||
      forecast.question_type === QuestionType.Discrete
        ? "below "
        : "before ") +
      valueText[0] +
      ")"
    );
  }
  if (q1 === "inRange" && q2 === "inRange" && q3 === "inRange") {
    return valueText[2] + " (" + valueText[1] + " - " + valueText[3] + ")";
  }
  if (q1 === "inRange" && q2 === "inRange" && q3 === "above") {
    return (
      valueText[2] +
      " (" +
      probAbove +
      "% " +
      (forecast.question_type === QuestionType.Numeric ||
      forecast.question_type === QuestionType.Discrete
        ? "above "
        : "after ") +
      valueText[4] +
      ")"
    );
  }
  if (q1 === "inRange" && q2 === "above" && q3 === "above") {
    return (
      probAbove +
      "% " +
      (forecast.question_type === QuestionType.Numeric ||
      forecast.question_type === QuestionType.Discrete
        ? "above "
        : "after ") +
      valueText[4] +
      " (lower 25%=" +
      valueText[1] +
      ")"
    );
  }
  if (q1 === "above" && q2 === "above" && q3 === "above") {
    return (
      probAbove +
      "% " +
      (forecast.question_type === QuestionType.Numeric ||
      forecast.question_type === QuestionType.Discrete
        ? "above "
        : "after ") +
      valueText[4]
    );
  }
  if (q1 === "below" && q2 === "inRange" && q3 === "above") {
    return valueText[2] + " (" + valueText[1] + " - " + valueText[3] + ")";
  }
  return "";
}

const ForecastValue: FC<ForecastValueProps> = ({ forecast }) => {
  const t = useTranslations();
  const [showAll, setShowAll] = useState(false);

  if (forecast.question_type === QuestionType.MultipleChoice) {
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
            className={cn("flex items-center gap-2 pr-2", {
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

  return (
    <div className="order-1 grow-0 text-xl font-bold text-gray-900 dark:text-gray-900-dark">
      {formatForecastValueText(forecast)}
    </div>
  );
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
      <div
        className="order-1 grow-0 text-gray-600 dark:text-gray-600-dark"
        suppressHydrationWarning
      >
        {formatDate(locale, forecast.start_time)}
      </div>
    </div>
  );
};

export default IncludedForecast;
