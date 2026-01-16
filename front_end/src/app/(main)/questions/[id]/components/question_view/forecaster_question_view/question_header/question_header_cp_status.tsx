"use client";
import { useLocale, useTranslations } from "next-intl";
import React, { FC } from "react";
import { VictoryThemeDefinition } from "victory";

import {
  useEmbedContainerWidth,
  useIsEmbedMode,
} from "@/app/(embed)/questions/components/question_view_mode_context";
import QuestionHeaderContinuousResolutionChip from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_continuous_resolution_chip";
import { getContinuousAreaChartData } from "@/components/charts/continuous_area_chart";
import MinifiedContinuousAreaChart from "@/components/charts/minified_continuous_area_chart";
import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionResolutionChip from "@/components/consumer_post_card/question_resolution_chip";
import QuestionCPMovement from "@/components/cp_movement";
import ContinuousCPBar from "@/components/post_card/question_tile/continuous_cp_bar";
import { useHideCP } from "@/contexts/cp_context";
import { QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { formatResolution } from "@/utils/formatters/resolution";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  question: QuestionWithForecasts;
  size: "md" | "lg";
  hideLabel?: boolean;
  colorOverride?: string;
  chartTheme?: VictoryThemeDefinition;
};

const QuestionHeaderCPStatus: FC<Props> = ({
  question,
  size,
  hideLabel = false,
  colorOverride,
  chartTheme,
}) => {
  const locale = useLocale();
  const t = useTranslations();
  const { hideCP } = useHideCP();
  const forecastAvailability = getQuestionForecastAvailability(question);
  const isContinuous =
    question.type === QuestionType.Numeric ||
    question.type === QuestionType.Discrete ||
    question.type === QuestionType.Date;
  const continuousAreaChartData = !isContinuous
    ? null
    : getContinuousAreaChartData({
        question,
        isClosed: question.status === QuestionStatus.CLOSED,
      });

  const isEmbed = useIsEmbedMode();
  const w = useEmbedContainerWidth();
  const isEmbedBelow376 = isEmbed && (w ?? 0) > 0 && (w ?? 0) < 376;

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

  const borderStyle = colorOverride
    ? { borderColor: `${colorOverride}33` }
    : undefined;

  if (isContinuous) {
    return (
      !forecastAvailability.isEmpty && (
        <div
          style={borderStyle}
          className={cn(
            "flex min-w-[110px] flex-col rounded-md border border-olive-800/20 p-2 dark:border-olive-800 md:px-3 md:py-2.5",
            {
              "min-h-full w-[200px]": size === "lg" && hideLabel,
              "w-max max-w-[200px]": size === "lg" && !hideLabel,
              "max-w-[130px]": size === "md",
              "gap-1": !hideLabel && size === "lg",
              "gap-0": size === "md", // Remove gap for mobile (both hideLabel true/false)
              "-gap-2": size === "md" && hideLabel, // More negative gap for mobile continuous questions,
              "border-[0.5px] border-olive-500 p-3 dark:border-olive-500-dark md:p-3":
                isEmbed,
              "min-w-[200px] border-none p-0": isEmbedBelow376,
            }
          )}
        >
          <div>
            {!hideLabel && (
              <div
                className={cn(
                  "mb-1 hidden text-center text-sm text-gray-500 dark:text-gray-500-dark lg:block"
                )}
              >
                {question.status === QuestionStatus.CLOSED
                  ? t("closed")
                  : t("communityPredictionLabel")}
              </div>
            )}
            {isEmbedBelow376 && (
              <p className="my-0 text-center text-xs text-olive-700 dark:text-olive-700-dark">
                {t("currentEstimate")}
              </p>
            )}
            {!hideCP && (
              <ContinuousCPBar
                question={question as QuestionWithForecasts}
                size={size}
                variant="question"
                colorOverride={colorOverride}
              />
            )}
          </div>
          {!!continuousAreaChartData && (
            <div
              className={cn({
                "flex min-h-0 flex-1 items-center": hideLabel, // Desktop timeline: flex and center
                "": !hideLabel, // Mobile: no special styling
                "mt-1.5": isEmbed,
              })}
            >
              <MinifiedContinuousAreaChart
                question={question}
                data={continuousAreaChartData}
                height={
                  hideLabel && size === "lg"
                    ? 120
                    : isEmbed
                      ? isEmbedBelow376
                        ? 32
                        : 24
                      : 50
                }
                forceTickCount={2}
                hideLabels={hideLabel || isEmbedBelow376}
                minMaxLabelsOnly={isEmbedBelow376}
                showBaseline={isEmbedBelow376}
                hideCP={hideCP}
                extraTheme={chartTheme}
                colorOverride={colorOverride}
              />
            </div>
          )}
          {!hideCP && (
            <QuestionCPMovement
              question={question}
              className={cn(
                "mx-auto min-w-[100px] max-w-full text-center md:[&>span]:whitespace-normal",
                {
                  "-mt-2 text-center": size === "md" && hideLabel,
                  "text-center": size === "md" && !hideLabel,
                  "mt-0 md:[&>span]:whitespace-nowrap": isEmbed,
                }
              )}
              size={"sm"}
              unit={size === "md" ? "" : undefined}
              boldValueUnit={true}
            />
          )}
        </div>
      )
    );
  } else if (question.type === QuestionType.Binary) {
    return (
      <div
        className={cn(
          "flex flex-col",
          {
            "gap-4": size === "lg", // Desktop: 16px gap
            "gap-1.5": size === "md", // Mobile: 6px gap
          },
          isEmbed && "[@container(max-width:375px)]:scale-[130%]"
        )}
      >
        {!hideCP && (
          <BinaryCPBar
            question={question}
            size={size === "lg" ? "lg" : "sm"}
            colorOverride={colorOverride}
          />
        )}
        {!hideCP && (
          <QuestionCPMovement
            question={question}
            className={cn("mx-auto pb-1 text-center", {
              "w-max max-w-[120px]": size === "md", // 🎯 Mobile constraint
            })}
            size="sm"
            unit={"%"}
            variant={"chip"}
            boldValueUnit={true}
          />
        )}
      </div>
    );
  }

  return null;
};

export default QuestionHeaderCPStatus;
