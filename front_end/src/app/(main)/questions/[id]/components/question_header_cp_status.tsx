"use client";
import React, { FC } from "react";

import QuestionResolutionStatus from "@/app/(main)/questions/[id]/components/question_resolution_status";
import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import { QuestionCPMovementWithChip } from "@/components/cp_movement";
import PredictionContinuousInfo from "@/components/post_card/question_tile/prediction_continuous_info";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

type Props = {
  post: PostWithForecasts;
};

const QuestionHeaderCPStatus: FC<Props> = ({ post }) => {
  const question = post.question as QuestionWithForecasts;

  if (post.resolved) {
    return <QuestionResolutionStatus post={post} />;
  }

  const latest_cp = question.aggregations.recency_weighted.latest;
  if (!latest_cp?.centers) {
    return null;
  }

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Discrete:
    case QuestionType.Date:
      return (
        <PredictionContinuousInfo
          question={question}
          canPredict={false}
          showMyPrediction={false}
        />
      );
    case QuestionType.Binary:
      return (
        <div className="flex flex-col gap-5">
          <BinaryCPBar question={question} size="lg" />
          <QuestionCPMovementWithChip
            question={question}
            className="mx-auto pb-1 text-center"
            size={"sm"}
            // Just to show % instead of pp
            presentation="consumerView"
            showChip={true}
          />
        </div>
      );
    default:
      return null;
  }
};

export default QuestionHeaderCPStatus;
