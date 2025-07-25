"use client";
import { useLocale } from "next-intl";
import React, { FC } from "react";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionResolutionChip from "@/components/consumer_post_card/question_resolution_chip";
import { QuestionCPMovementWithChip } from "@/components/cp_movement";
import PredictionContinuousInfo from "@/components/post_card/question_tile/prediction_continuous_info";
import { PostWithForecasts, QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { formatResolution } from "@/utils/formatters/resolution";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  post: PostWithForecasts;
  size: "sm" | "lg";
};

const QuestionHeaderCPStatus: FC<Props> = ({ post, size }) => {
  const question = post.question as QuestionWithForecasts;
  const locale = useLocale();

  /*
   * TODO: maybe make a universal component with Feed Tiles?
   * */

  if (question.status === QuestionStatus.RESOLVED && question.resolution) {
    // Resolved/Annulled/Ambiguous
    const formatedResolution = formatResolution({
      resolution: question.resolution,
      questionType: question.type,
      scaling: question.scaling,
      locale,
      unit: question.unit,
      actual_resolve_time: question.actual_resolve_time ?? null,
      completeBounds: true,
      longBounds: true,
    });
    const successfullyResolved = isSuccessfullyResolved(question.resolution);
    return (
      <QuestionResolutionChip
        formatedResolution={formatedResolution}
        successfullyResolved={successfullyResolved}
        unit={question.unit}
        size="lg"
      />
    );
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
