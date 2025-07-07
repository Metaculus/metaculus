import { useTranslations } from "next-intl";
import { FC } from "react";

import ReaffirmButton from "@/components/post_card/reaffirm_button";
import { QuestionStatus } from "@/types/post";
import { QuestionWithForecasts, UserForecast } from "@/types/question";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";

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

  if (
    showUserForecast &&
    latest &&
    isForecastActive(latest) &&
    question.status === QuestionStatus.OPEN
  ) {
    const displayValue = getPredictionDisplayValue(
      latest.centers ? latest.centers[0] : latest.forecast_values[1],
      {
        questionType: question.type,
        scaling: question.scaling,
        actual_resolve_time: question.actual_resolve_time ?? null,
      }
    );

    return (
      <div
        className={cn(
          "b inline-flex flex-col border-t-[0.5px] border-gray-400 pt-2.5 dark:border-gray-400-dark",
          className
        )}
      >
        <div className="text-xs text-orange-800 dark:text-orange-800-dark">
          <span className="capitalize">{t("me")}: </span>
          <span className="font-bold">{displayValue}</span>{" "}
          {!!onReaffirm && canPredict && (
            <ReaffirmButton
              onClick={() => {
                onReaffirm(latest);
              }}
              // TODO: what should we do with button "jumping" on click?
              className="ml-1.5"
            />
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default MyPredictionChip;
