"use client";
import React, { FC } from "react";

import QuestionResolutionStatus from "@/app/(main)/questions/[id]/components/question_resolution_status";
import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import { QuestionCPMovementWithChip } from "@/components/cp_movement";
import PredictionContinuousInfo from "@/components/post_card/question_tile/prediction_continuous_info";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  post: PostWithForecasts;
  size: "sm" | "lg";
};

const QuestionHeaderCPStatus: FC<Props> = ({ post, size }) => {
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
        <div
          className={cn("flex flex-col gap-5", {
            "gap-5": size === "lg",
            "gap-3": size === "sm",
          })}
        >
          <BinaryCPBar question={question} size={size} />
          <QuestionCPMovementWithChip
            question={question}
            className={cn("mx-auto pb-1 text-center", {
              "w-max max-w-[120px]": size === "sm",
            })}
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
