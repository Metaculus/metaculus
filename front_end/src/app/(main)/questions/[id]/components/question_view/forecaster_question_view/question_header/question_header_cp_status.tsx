"use client";
import { useLocale, useTranslations } from "next-intl";
import React, { FC, useMemo } from "react";
import { VictoryThemeDefinition } from "victory";

import {
  useEmbedContainerWidth,
  useIsEmbedMode,
} from "@/app/(embed)/questions/components/question_view_mode_context";
import QuestionHeaderContinuousResolutionChip from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_continuous_resolution_chip";
import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import {
  ContinuousAreaGraphInput,
  getContinuousAreaChartData,
} from "@/components/charts/continuous_area_chart";
import MinifiedContinuousAreaChart from "@/components/charts/minified_continuous_area_chart";
import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionResolutionChip from "@/components/consumer_post_card/question_resolution_chip";
import QuestionCPMovement from "@/components/cp_movement";
import ContinuousCPBar from "@/components/post_card/question_tile/continuous_cp_bar";
import { useHideCP } from "@/contexts/cp_context";
import { ContinuousAreaType } from "@/types/charts";
import { QuestionStatus } from "@/types/post";
import {
  NumericAggregateForecast,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";
import cn from "@/utils/core/cn";
import { formatResolution } from "@/utils/formatters/resolution";
import { cdfToPmf } from "@/utils/math";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  question: QuestionWithForecasts;
  size: "md" | "lg";
  hideLabel?: boolean;
  colorOverride?: string;
  chartTheme?: VictoryThemeDefinition;
  cursorForecast?: NumericAggregateForecast | null;
  cursorUserForecastValues?: number[] | null;
  cursorBinaryValue?: number | null;
};

const QuestionHeaderCPStatus: FC<Props> = ({
  question,
  size,
  hideLabel = false,
  colorOverride,
  chartTheme,
  cursorForecast,
  cursorUserForecastValues,
  cursorBinaryValue,
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
        isResolved: question.status === QuestionStatus.RESOLVED,
      });

  const isEmbed = useIsEmbedMode();
  const w = useEmbedContainerWidth();
  const isEmbedBelow376 = isEmbed && (w ?? 0) > 0 && (w ?? 0) < 376;
  const isEmbedWide = isEmbed && (w ?? 0) >= 500;

  const cursorForecastValues = cursorForecast?.forecast_values ?? null;
  const cursorAreaChartData = useMemo<ContinuousAreaGraphInput | null>(() => {
    if (!cursorForecastValues) return null;
    const communityType: ContinuousAreaType =
      question.status === QuestionStatus.RESOLVED
        ? "community_resolved"
        : question.status === QuestionStatus.CLOSED
          ? "community_closed"
          : "community";
    const data: ContinuousAreaGraphInput = [
      {
        pmf: cdfToPmf(cursorForecastValues),
        cdf: cursorForecastValues,
        type: communityType,
      },
    ];
    if (cursorUserForecastValues) {
      data.push({
        pmf: cdfToPmf(cursorUserForecastValues),
        cdf: cursorUserForecastValues,
        type: "user",
      });
    }
    return data;
  }, [cursorForecastValues, cursorUserForecastValues, question.status]);

  if (
    question.status === QuestionStatus.RESOLVED &&
    question.resolution &&
    (!isContinuous || !cursorForecast)
  ) {
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

  const embedBorderClass =
    question.status === QuestionStatus.RESOLVED
      ? "border-[0.5px] border-purple-500 p-3 dark:border-purple-500-dark md:p-3"
      : question.status === QuestionStatus.CLOSED
        ? "border-[0.5px] border-gray-500 p-3 dark:border-gray-500-dark md:p-3"
        : "border-[0.5px] border-olive-500 p-3 dark:border-olive-500-dark md:p-3";

  const cursorCenter = cursorForecast?.centers?.[0] ?? null;
  const cursorLower = cursorForecast?.interval_lower_bounds?.[0] ?? null;
  const cursorUpper = cursorForecast?.interval_upper_bounds?.[0] ?? null;

  if (isContinuous) {
    const containerClassName = cn(
      "flex min-w-[110px] flex-col rounded-md border border-olive-800/20 p-2 dark:border-olive-800 md:px-3 md:py-2.5",
      {
        "min-h-full w-[200px]": size === "lg" && hideLabel,
        "w-max max-w-[200px]": size === "lg" && !hideLabel,
        "max-w-[130px]":
          !forecastAvailability.cpRevealsOn &&
          (size === "md" || (isEmbed && !isEmbedBelow376 && !isEmbedWide)),
        "gap-1": !hideLabel && size === "lg",
        "gap-0": size === "md",
        "-gap-2": size === "md" && hideLabel,
        [embedBorderClass]: isEmbed,
        "max-w-[195px]": isEmbedWide,
        "min-w-[200px] border-none p-0": isEmbedBelow376,
      }
    );

    // No forecasts and no upcoming reveal — render empty outline box to preserve column width
    if (forecastAvailability.isEmpty && !forecastAvailability.cpRevealsOn) {
      return (
        <div
          style={borderStyle}
          className={cn(containerClassName, "items-center justify-center")}
        >
          <p className="my-0 text-center text-sm text-gray-500 dark:text-gray-500-dark">
            {t("currentEstimate")}
          </p>
        </div>
      );
    }

    if (forecastAvailability.cpRevealsOn) {
      return null;
    }

    // CP hidden by user preference — center the reveal button, skip the mini chart
    if (hideCP && !isEmbed) {
      if (size === "md") {
        return (
          <div className="flex flex-col items-center justify-center">
            <RevealCPButton />
          </div>
        );
      }
      return (
        <div
          style={borderStyle}
          className={cn(containerClassName, "items-center justify-center")}
        >
          <RevealCPButton />
        </div>
      );
    }

    return (
      <div style={borderStyle} className={containerClassName}>
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
          {!hideCP && !forecastAvailability.cpRevealsOn && (
            <ContinuousCPBar
              question={question as QuestionWithForecasts}
              size={size}
              variant="question"
              colorOverride={colorOverride}
              overrideCenter={cursorCenter}
              overrideBounds={
                cursorLower !== null && cursorUpper !== null
                  ? [cursorLower, cursorUpper]
                  : null
              }
            />
          )}
        </div>
        {!!continuousAreaChartData && !forecastAvailability.cpRevealsOn && (
          <div
            className={cn({
              "flex min-h-0 flex-1 items-center": hideLabel,
              "": !hideLabel,
              "mt-1.5": isEmbed,
            })}
          >
            <MinifiedContinuousAreaChart
              question={question}
              data={cursorAreaChartData ?? continuousAreaChartData}
              height={
                hideLabel && size === "lg"
                  ? 120
                  : isEmbed
                    ? isEmbedBelow376
                      ? 32
                      : isEmbedWide
                        ? 90
                        : 50
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
        {!hideCP && !forecastAvailability.cpRevealsOn && (
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
    );
  } else if (question.type === QuestionType.Binary) {
    if (forecastAvailability.cpRevealsOn) {
      return null;
    }

    if (hideCP) {
      if (isEmbed) {
        return null;
      }
      return (
        <div
          className={cn("flex flex-col items-center justify-center", {
            "w-36": size === "lg",
          })}
        >
          <RevealCPButton />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex flex-col",
          {
            "w-36 items-center": size === "lg",
            "gap-1.5": size === "md",
          },
          isEmbed && "[@container(max-width:375px)]:scale-[130%]"
        )}
      >
        {!hideCP && (
          <BinaryCPBar
            question={question}
            size={size === "lg" ? "lg" : "sm"}
            colorOverride={colorOverride}
            overrideValue={cursorBinaryValue}
          />
        )}
        {!hideCP && (
          <QuestionCPMovement
            question={question}
            className={cn("mx-auto pb-1 text-center", {
              "w-max max-w-32": size === "md",
              "mt-6": size === "lg",
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
