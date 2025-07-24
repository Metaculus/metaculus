import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import ReaffirmButton from "@/components/post_card/reaffirm_button";
import { QuestionStatus } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  UserForecast,
} from "@/types/question";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";
import {
  getDiscreteValueOptions,
  getPredictionDisplayValue,
} from "@/utils/formatters/prediction";

type Props = {
  question: QuestionWithForecasts;
  className?: string;
  showUserForecast?: boolean;
  onReaffirm?: (userForecast: UserForecast) => void;
  canPredict?: boolean;
};

const MyPredictionChip: FC<Props> = ({
  question,
  className,
  showUserForecast,
  onReaffirm,
  canPredict = false,
}) => {
  const t = useTranslations();
  const latest = question.my_forecasts?.latest;

  if (showUserForecast && latest && isForecastActive(latest)) {
    const range =
      !isNil(latest?.interval_lower_bounds?.[0]) &&
      !isNil(latest?.interval_upper_bounds?.[0])
        ? [
            latest?.interval_lower_bounds?.[0] as number,
            latest?.interval_upper_bounds?.[0] as number,
          ]
        : undefined;

    const discreteValueOptions = getDiscreteValueOptions(question);
    const displayValue = getPredictionDisplayValue(
      latest.centers ? latest.centers[0] : latest.forecast_values[1],
      {
        questionType: question.type,
        scaling: question.scaling,
        range,
        unit: range ? undefined : question.unit,
        actual_resolve_time: question.actual_resolve_time ?? null,
        discreteValueOptions,
      },
      false
    );
    const displayValueChunks = displayValue.split("\n");
    const [centerLabel, intervalLabel] = displayValueChunks;

    return (
      <div
        className={cn(
          "flex flex-row items-center justify-center gap-1.5 border-t-[0.5px] border-gray-400 pt-2.5 text-center text-xs text-orange-800 dark:border-gray-400-dark dark:text-orange-800-dark",
          className,
          {
            "flex-col": question.type === QuestionType.Date,
          }
        )}
      >
        <div>
          <span
            className={cn("capitalize", {
              "font-bold": range,
            })}
          >
            {t("me")}: <span className="font-bold">{centerLabel}</span>
          </span>
          {!isNil(intervalLabel) && (
            <div className="text-xs font-normal">{intervalLabel}</div>
          )}
        </div>
        {!!onReaffirm &&
          canPredict &&
          question.status === QuestionStatus.OPEN && (
            <ReaffirmButton
              onClick={() => {
                onReaffirm(latest);
              }}
            />
          )}
      </div>
    );
  }

  return null;
};

export default MyPredictionChip;
