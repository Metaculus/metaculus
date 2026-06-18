"use client";

import { capitalize, isNil } from "lodash";
import { FC } from "react";

import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  getDiscreteValueOptions,
  getPredictionDisplayValue,
} from "@/utils/formatters/prediction";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  question: QuestionWithNumericForecasts;
  className?: string;
};

const ContinuousCompactForecastText: FC<Props> = ({ question, className }) => {
  if (isUnsuccessfullyResolved(question.resolution)) {
    return (
      <span
        className={cn(
          "text-xs font-medium text-gray-700 dark:text-gray-700-dark",
          className
        )}
      >
        <span className="font-bold">
          {capitalize(question.resolution as string)}
        </span>
      </span>
    );
  }

  const latest =
    question.aggregations[question.default_aggregation_method]?.latest;

  if (!latest) {
    return null;
  }

  const displayValue = getPredictionDisplayValue(
    latest.centers?.[0],
    {
      questionType: question.type,
      scaling: question.scaling,
      range:
        !isNil(latest.interval_lower_bounds?.[0]) &&
        !isNil(latest.interval_upper_bounds?.[0])
          ? [
              latest.interval_lower_bounds?.[0] as number,
              latest.interval_upper_bounds?.[0] as number,
            ]
          : [],
      unit: question.unit,
      actual_resolve_time: question.actual_resolve_time ?? null,
      discreteValueOptions: getDiscreteValueOptions(question),
    },
    false
  );
  const [centerLabel, intervalLabel] = displayValue.split("\n");
  const isClosed = question.status === QuestionStatus.CLOSED;
  const isResolved = question.status === QuestionStatus.RESOLVED;

  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        isClosed && "text-gray-800 dark:text-gray-800-dark",
        isResolved && "text-purple-800 dark:text-purple-800-dark",
        !isClosed && !isResolved && "text-olive-800 dark:text-olive-800-dark",
        className
      )}
    >
      <span className="font-bold">{centerLabel}</span>
      {intervalLabel && <span> {intervalLabel}</span>}
    </span>
  );
};

export default ContinuousCompactForecastText;
