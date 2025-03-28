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

  const latest_cp = question.aggregations.recency_weighted.latest;
  if (!latest_cp?.centers) {
    return null;
  }

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
    case QuestionType.Discrete:
      return (
        <PredictionChip
          question={question}
          status={post.status}
          className="items-end"
        />
      );
    case QuestionType.Binary:
      return (
        <PredictionChip
          question={question}
          status={post.status}
          className="items-end"
        />
      );
    default:
      return null;
  }
};

export default QuestionResolutionStatus;
