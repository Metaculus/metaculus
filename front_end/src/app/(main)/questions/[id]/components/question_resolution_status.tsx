"use client";
import { FC } from "react";

import PredictionChip from "@/components/prediction_chip";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

type Props = {
  post: PostWithForecasts;
};

const QuestionResolutionStatus: FC<Props> = ({ post }) => {
  const question = post.question as QuestionWithForecasts;

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
    case QuestionType.Binary:
      return (
        <PredictionChip
          question={question}
          prediction={
            question.forecasts.medians[question.forecasts.medians.length - 1]
          }
          status={post.status}
          className="items-end"
        />
      );
    default:
      return null;
  }
};

export default QuestionResolutionStatus;
