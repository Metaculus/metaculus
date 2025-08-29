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
  variant?: "binary" | "continuous";
};

const MyPredictionChip: FC<Props> = ({
  question,
  className,
  showUserForecast,
  onReaffirm,
  canPredict = false,
  variant = "continuous", // Default to continuous for backward compatibility
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
          "flex w-full flex-row items-center gap-1 text-xs text-orange-800 dark:text-orange-800-dark",
          {
            "flex-col": question.type === QuestionType.Date,
            // Variant-based styling
            "justify-center text-center md:items-start md:justify-start md:text-left":
              variant === "continuous",
            "justify-start text-left": variant === "binary",
          },
          className
        )}
      >
        <div
          className={cn("flex flex-col gap-0.5", {
            "items-center md:items-start": variant === "continuous",
          })}
        >
          <span
            className={cn("capitalize", {
              "text-xs font-light tabular-nums": range,
            })}
          >
            {t("me")}: <span className="font-bold">{centerLabel}</span>
          </span>
          {!isNil(intervalLabel) && (
            <div
              className={cn("text-[10px] font-normal tabular-nums md:text-xs", {
                "text-center": variant === "continuous",
                "text-left": variant === "binary",
              })}
            >
              {intervalLabel}
            </div>
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
