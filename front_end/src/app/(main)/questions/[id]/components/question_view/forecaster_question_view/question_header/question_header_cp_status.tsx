"use client";
import { useLocale, useTranslations } from "next-intl";
import React, { FC } from "react";

import QuestionHeaderContinuousResolutionChip from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_continuous_resolution_chip";
import { getContinuousAreaChartData } from "@/components/charts/continuous_area_chart";
import MinifiedContinuousAreaChart from "@/components/charts/minified_continuous_area_chart";
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
  hideLabel?: boolean;
};

const QuestionHeaderCPStatus: FC<Props> = ({
  question,
  size,
  hideLabel = false,
}) => {
  const locale = useLocale();
  const t = useTranslations();
  const forecastAvailability = getQuestionForecastAvailability(question);
  const continuousAreaChartData = getContinuousAreaChartData({
    question,
    isClosed: question.status === QuestionStatus.CLOSED,
  });
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
          question={question}
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
          className={cn(
            "flex min-w-[110px] flex-col rounded-md border border-olive-800/20 p-2 dark:border-olive-800 md:px-3 md:py-2.5",
            {
              "h-full w-[200px]": size === "lg" && hideLabel,
              "w-max max-w-[200px]": size === "lg" && !hideLabel,
              "max-w-[130px]": size === "md",
              "gap-1": !hideLabel && size === "lg",
              "gap-0": size === "md", // Remove gap for mobile (both hideLabel true/false)
              "-gap-2": size === "md" && hideLabel, // More negative gap for mobile continuous questions
            }
          )}
        >
          <div>
            {!hideLabel && (
              <div className="mb-1 hidden text-center text-sm text-gray-500 dark:text-gray-500-dark lg:block">
                {question.status === QuestionStatus.CLOSED
                  ? t("closed")
                  : t("communityPredictionLabel")}
              </div>
            )}
            <ContinuousCPBar
              question={question as QuestionWithNumericForecasts}
              size={size}
              variant="question"
            />
          </div>
          <div
            className={cn({
              "flex min-h-0 flex-1 items-center": hideLabel, // Desktop timeline: flex and center
              "": !hideLabel, // Mobile: no special styling
            })}
          >
            <MinifiedContinuousAreaChart
              question={question}
              data={continuousAreaChartData}
              height={hideLabel && size === "lg" ? 120 : 50}
              forceTickCount={2}
              hideLabels={hideLabel}
            />
          </div>
          <QuestionCPMovement
            question={question}
            className={cn("mx-auto min-w-[100px]", {
              "-mt-2 text-center": size === "md" && hideLabel, // Center + negative margin for mobile continuous
              "text-center": size === "md" && !hideLabel, // Just center for mobile binary
            })}
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
