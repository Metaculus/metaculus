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
  variant?: "feed" | "question";
};

const ContinuousCPBar: FC<Props> = ({
  question,
  size = "md",
  variant = "feed",
}) => {
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
        "relative flex flex-col justify-center gap-0 pt-0.5 tabular-nums text-olive-900 dark:text-olive-900-dark md:gap-0.5 md:pt-1",
        {
          "text-gray-800 dark:text-gray-800-dark":
            question.status === QuestionStatus.CLOSED,
          // Feed variant: center on mobile, left on desktop
          "text-center md:text-left": variant === "feed",
          // Question variant: always center
          "text-center": variant === "question",
        }
      )}
    >
      <div
        className={cn("text-sm font-bold md:text-base", {
          "mb-1 text-base": size === "lg",
        })}
      >
        {centerLabel}
      </div>
      {!isNil(intervalLabel) && (
        <div
          className={cn("text-[10px] font-normal tabular-nums md:text-xs", {
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
