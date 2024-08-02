import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { FC } from "react";

import { QuestionWithNumericForecasts, QuestionType } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import { getIsForecastEmpty } from "@/utils/forecasts";

type Props = {
  question: QuestionWithNumericForecasts;
  isGroup?: boolean;
  className?: string;
};

const SimilarPredictionChip: FC<Props> = ({
  question,
  isGroup = false,
  className,
}) => {
  if (
    ![QuestionType.Numeric, QuestionType.Date, QuestionType.Binary].includes(
      question.type
    )
  ) {
    return null;
  } else if (
    isGroup &&
    ![QuestionType.Numeric, QuestionType.Date].includes(question.type)
  ) {
    return null;
  }
  const isForecastEmpty = getIsForecastEmpty(question.forecasts);
  if (isForecastEmpty) return null;

  const prediction =
    question.forecasts.medians[question.forecasts.medians.length - 1];

  {
    return (
      <span
        className={classNames(
          "flex flex-row gap-0.5 text-xs font-medium text-olive-700 dark:text-olive-400",
          className
        )}
      >
        <FontAwesomeIcon icon={faUserGroup} className="!w-[13px]" />
        <span>{prediction ? getDisplayValue(prediction, question) : ""}</span>
      </span>
    );
  }
};

export default SimilarPredictionChip;
