"use client";
import { useLocale, useTranslations } from "next-intl";
import React, { FC } from "react";

import QuestionHeaderContinuousResolutionChip from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_continuous_resolution_chip";
import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionResolutionChip from "@/components/consumer_post_card/question_resolution_chip";
import QuestionCPMovement from "@/components/cp_movement";
import ContinuousCPBar from "@/components/post_card/question_tile/continuous_cp_bar";
import { QuestionStatus } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
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
  const isContinuous = [
    QuestionType.Numeric,
    QuestionType.Discrete,
    QuestionType.Date,
  ].includes(question.type);

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

    if (isContinuous) {
      return (
        <QuestionHeaderContinuousResolutionChip
          formatedResolution={formatedResolution}
          successfullyResolved={successfullyResolved}
          size={size}
        />
      );
    }

    return (
      <QuestionResolutionChip
        formatedResolution={formatedResolution}
        successfullyResolved={successfullyResolved}
        unit={question.unit}
        size={size}
      />
    );
  }

  if (isContinuous) {
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
            <ContinuousCPBar
              question={question as QuestionWithNumericForecasts}
              size={size}
            />
          </div>
          {/* TODO: @ncarazon add mini-graph here */}
          <QuestionCPMovement
            question={question}
            className="mx-auto"
            size={"sm"}
            // Hide unit on small sizes
            unit={size === "md" ? "" : undefined}
            boldValueUnit={true}
          />
        </div>
      )
    );
  } else if (question.type === QuestionType.Binary) {
    return (
      <div
        className={cn("flex flex-col gap-5", {
          "gap-5": size === "lg",
          "gap-3": size === "md",
        })}
      >
        <BinaryCPBar question={question} size={size === "lg" ? "lg" : "sm"} />
        <QuestionCPMovement
          question={question}
          className={cn("mx-auto pb-1 text-center", {
            "w-max max-w-[120px]": size === "md",
          })}
          size="sm"
          // Just to show % instead of pp
          unit={"%"}
          variant={"chip"}
        />
      </div>
    );
  }

  return null;
};

export default QuestionHeaderCPStatus;
