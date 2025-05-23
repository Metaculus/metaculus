import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { FC } from "react";

import { QuestionWithNumericForecasts, QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";

type Props = {
  question: QuestionWithNumericForecasts | null;
  isGroup?: boolean;
  className?: string;
};

const SimilarPredictionChip: FC<Props> = ({
  question,
  isGroup = false,
  className,
}) => {
  if (!question) {
    return null;
  }

  if (
    ![
      QuestionType.Binary,
      QuestionType.Numeric,
      QuestionType.Discrete,
      QuestionType.Date,
    ].includes(question.type)
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
  const prediction = latest?.centers?.[0];

  {
    return (
      <span
        className={cn(
          "flex flex-row gap-0.5 text-xs font-medium text-olive-700 dark:text-olive-400",
          className
        )}
      >
        <FontAwesomeIcon icon={faUserGroup} className="!w-[13px]" />
        <span>
          {!isNil(prediction)
            ? getPredictionDisplayValue(prediction, {
                questionType: question.type,
                scaling: question.scaling,
                actual_resolve_time: question.actual_resolve_time ?? null,
              })
            : ""}
        </span>
      </span>
    );
  }
};

export default SimilarPredictionChip;
