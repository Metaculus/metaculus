"use client";
import { useLocale, useTranslations } from "next-intl";
import React, { FC } from "react";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionResolutionChip from "@/components/consumer_post_card/question_resolution_chip";
import QuestionCPMovement from "@/components/cp_movement";
import ContinuousCPBar from "@/components/post_card/question_tile/continuous_cp_bar";
import { QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { formatResolution } from "@/utils/formatters/resolution";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  question: QuestionWithForecasts;
  size: "md" | "lg";
};

const QuestionHeaderCPStatus: FC<Props> = ({ question, size }) => {
  const locale = useLocale();
  const t = useTranslations();
  const forecastAvailability = getQuestionForecastAvailability(question);

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
        size={size}
      />
    );
  }

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Discrete:
    case QuestionType.Date:
      return (
        !forecastAvailability.isEmpty && (
          <div
            className={cn("flex w-max flex-col", {
              "max-w-[200px] gap-4": size === "lg",
              "max-w-[130px] gap-3": size === "md",
            })}
          >
            <div>
              <div className="mb-1 hidden text-center text-sm text-gray-500 dark:text-gray-500-dark lg:block">
                {question.status === QuestionStatus.CLOSED
                  ? t("closed")
                  : t("communityPredictionLabel")}
              </div>
              <ContinuousCPBar question={question} size={size} />
            </div>
            <QuestionCPMovement
              question={question}
              className="mx-auto"
              size={"sm"}
              unit={size === "md" ? "" : undefined}
              boldValueUnit={true}
            />
          </div>
        )
      );
    case QuestionType.Binary:
      return (
        <div
          className={cn("flex flex-col gap-5", {
            "gap-5": size === "lg",
            "gap-3": size === "md",
          })}
        >
          <BinaryCPBar question={question} size={size} />
          <QuestionCPMovement
            question={question}
            className={cn("mx-auto pb-1 text-center", {
              "w-max max-w-[120px]": size === "md",
            })}
            size={"sm"}
            // Just to show % instead of pp
            unit={"%"}
            variant={"chip"}
          />
        </div>
      );
    default:
      return null;
  }
};

export default QuestionHeaderCPStatus;
