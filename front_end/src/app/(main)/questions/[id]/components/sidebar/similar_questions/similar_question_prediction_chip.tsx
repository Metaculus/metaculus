import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { FC } from "react";

import { QuestionWithNumericForecasts, QuestionType } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";

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
  const isForecastEmpty =
    question.aggregations.recency_weighted.history.length === 0;
  if (isForecastEmpty) return null;

  const latest = question.aggregations.recency_weighted.latest;
  const prediction = latest?.centers![0];

  {
    return (
      <span
        className={classNames(
          "flex flex-row gap-0.5 text-xs font-medium text-olive-700 dark:text-olive-400",
          className
        )}
      >
        <FontAwesomeIcon icon={faUserGroup} className="!w-[13px]" />
        <span>
          {prediction
            ? getDisplayValue({
                value: prediction,
                questionType: question.type,
                scaling: question.scaling,
              })
            : ""}
        </span>
      </span>
    );
  }
};

export default SimilarPredictionChip;
