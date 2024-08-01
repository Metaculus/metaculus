"use client";
import { FC } from "react";

import PredictionChip from "@/components/prediction_chip";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

type Props = {
  post: PostWithForecasts;
};

const QuestionResolutionStatus: FC<Props> = ({ post }) => {
  if (!!post?.question) {
    const question = post.question;
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
            resolution={question.resolution}
            nr_forecasters={question.nr_forecasters}
            status={post.status}
            className="items-end"
          />
        );
      default:
        return null;
    }
  }
};

export default QuestionResolutionStatus;
