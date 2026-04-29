"use client";

import { format, isValid } from "date-fns";
import { useLocale } from "next-intl";
import { FC } from "react";

import { getContinuousAreaChartData } from "@/components/charts/continuous_area_chart";
import MinifiedContinuousAreaChart from "@/components/charts/minified_continuous_area_chart";
import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionResolutionChip from "@/components/consumer_post_card/question_resolution_chip";
import { QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { formatResolution } from "@/utils/formatters/resolution";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  question: QuestionWithForecasts;
};

// Fixed min width so every variant (binary gauge, continuous value+chart,
// resolution chip) lines up horizontally across different link rows.
const TILE_WRAPPER_CLASS =
  "flex min-w-[110px] flex-col items-center justify-center gap-1";

const CoherencePredictionTile: FC<Props> = ({ question }) => {
  const locale = useLocale();

  if (question.resolution) {
    // Dates get a compact "MMM yyyy" override so the tile stays narrow;
    // formatResolution would otherwise produce "05 May 2023 07:53 UTC".
    let formattedResolution: string;
    if (question.type === QuestionType.Date) {
      const dateCandidate = new Date(
        isNaN(Number(question.resolution))
          ? question.resolution
          : Number(question.resolution)
      );
      formattedResolution = isValid(dateCandidate)
        ? format(dateCandidate, "MMM yyyy")
        : String(question.resolution);
    } else {
      formattedResolution = formatResolution({
        resolution: question.resolution,
        questionType: question.type,
        scaling: question.scaling,
        locale,
        unit: question.unit,
        actual_resolve_time: question.actual_resolve_time ?? null,
        completeBounds: true,
        longBounds: true,
      });
    }
    return (
      <div className={TILE_WRAPPER_CLASS}>
        <QuestionResolutionChip
          formatedResolution={formattedResolution}
          successfullyResolved={isSuccessfullyResolved(question.resolution)}
          unit={question.unit}
          presentation="consumerView"
          size="sm"
        />
      </div>
    );
  }

  if (question.type === QuestionType.Binary) {
    return (
      <div className={TILE_WRAPPER_CLASS}>
        <BinaryCPBar question={question} size="sm" />
      </div>
    );
  }

  const latest =
    question.aggregations[question.default_aggregation_method]?.latest;
  const center = latest?.centers?.[0];
  const displayValue =
    center != null
      ? getPredictionDisplayValue(center, {
          questionType: question.type,
          scaling: question.scaling,
          actual_resolve_time: question.actual_resolve_time ?? null,
          unit: question.unit,
          // Always show month+year for dates so the tile stays short.
          dateFormatString:
            question.type === QuestionType.Date ? "MMM yyyy" : undefined,
        })
      : null;

  const chartData = getContinuousAreaChartData({
    question,
    isClosed: question.status === QuestionStatus.CLOSED,
  });

  return (
    <div className={TILE_WRAPPER_CLASS}>
      <div className="text-lg font-bold text-olive-900 dark:text-olive-900-dark">
        {displayValue ?? "—"}
      </div>
      <div className="w-full">
        <MinifiedContinuousAreaChart
          question={question}
          data={chartData}
          height={30}
          hideLabels
          forceTickCount={2}
          variant="feed"
        />
      </div>
    </div>
  );
};

export default CoherencePredictionTile;
