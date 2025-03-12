import { FC } from "react";

import { QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";

import BinaryCPBar from "./binary_cp_bar";

type Props = {
  question: QuestionWithNumericForecasts;
};

const QuestionForecastChip: FC<Props> = ({ question }) => {
  const isClosed = question.status === QuestionStatus.CLOSED;
  const latest = question.aggregations.recency_weighted.latest;
  const communityPredictionDisplayValue = latest
    ? getDisplayValue({
        value: latest.centers?.[0],
        questionType: question.type,
        scaling: question.scaling,
      })
    : null;

  if (question.type === QuestionType.Binary) {
    return <BinaryCPBar question={question} />;
  }

  return (
    <div className="flex min-w-[200px] max-w-[200px] justify-center">
      <div
        className={cn(
          "flex w-fit flex-col items-center rounded border-2 border-blue-400 bg-transparent px-5 py-2 dark:border-blue-400-dark dark:bg-transparent",
          {
            "border-gray-300 dark:border-gray-300-dark": isClosed,
          }
        )}
      >
        <span
          className={cn(
            "text-lg font-bold leading-7 text-blue-700 dark:text-blue-700-dark",
            {
              "text-gray-600 dark:text-gray-600-dark": isClosed,
            }
          )}
        >
          {communityPredictionDisplayValue}
        </span>
      </div>
    </div>
  );
};

export default QuestionForecastChip;
