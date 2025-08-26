import { isNil } from "lodash";
import React, { FC } from "react";

import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  getDiscreteValueOptions,
  getPredictionDisplayValue,
} from "@/utils/formatters/prediction";

type Props = {
  question: QuestionWithNumericForecasts;
  size?: "md" | "lg";
};

const ContinuousCPBar: FC<Props> = ({ question, size = "md" }) => {
  const latest =
    question.aggregations[question.default_aggregation_method]?.latest;

  if (!latest) {
    return null;
  }
  const discreteValueOptions = getDiscreteValueOptions(question);

  const displayValue = getPredictionDisplayValue(
    latest.centers?.[0],
    {
      questionType: question.type,
      scaling: question.scaling,
      range:
        !isNil(latest?.interval_lower_bounds?.[0]) &&
        !isNil(latest?.interval_upper_bounds?.[0])
          ? [
              latest?.interval_lower_bounds?.[0] as number,
              latest?.interval_upper_bounds?.[0] as number,
            ]
          : [],
      unit: question.unit,
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
        "flex flex-col justify-center text-center text-olive-800 dark:text-olive-800-dark",
        {
          "text-gray-800 dark:text-gray-800-dark":
            question.status === QuestionStatus.CLOSED,
        }
      )}
    >
      <div
        className={cn("text-base font-bold", {
          "mb-1 text-lg": size === "lg",
        })}
      >
        {centerLabel}
      </div>
      {!isNil(intervalLabel) && (
        <div
          className={cn("text-xs font-normal", {
            "text-sm": size === "lg",
          })}
        >
          {intervalLabel}
        </div>
      )}
    </div>
  );
};

export default ContinuousCPBar;
