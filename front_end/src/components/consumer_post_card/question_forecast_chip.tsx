import { FC } from "react";

import { QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";

import BinaryCPBar from "./binary_cp_bar";
import ContinuousCPBar from "./continuous_cp_bar";

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
    <ContinuousCPBar
      communityPredictionDisplayValue={communityPredictionDisplayValue}
      unit={question.unit}
      isClosed={isClosed}
    />
  );
};

export default QuestionForecastChip;
