import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import ContinuousCPBar from "@/components/consumer_post_card/consumer_question_tile/continuous_cp_bar";
import QuestionContinuousResolutionChip from "@/components/consumer_post_card/question_continuous_resolution_chip";
import { useHideCP } from "@/contexts/cp_context";
import { QuestionStatus } from "@/types/post";
import { ForecastAvailability, QuestionWithForecasts } from "@/types/question";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { formatResolution } from "@/utils/formatters/resolution";

type Props = {
  question: QuestionWithForecasts;
  forecastAvailability: ForecastAvailability;
  variant?: "feed" | "question";
  overrideCenter?: number | null;
};

const ConsumerContinuousTile: FC<Props> = ({
  question,
  forecastAvailability,
  variant = "feed",
  overrideCenter,
}) => {
  const locale = useLocale();
  const t = useTranslations();
  const { hideCP } = useHideCP();

  const latest =
    question.aggregations[question.default_aggregation_method]?.latest;
  // Cursor position overrides the latest CP center when hovering the timeline.
  const effectiveCenter =
    overrideCenter !== null && overrideCenter !== undefined
      ? overrideCenter
      : latest?.centers?.[0];
  const rawCommunityPredictionDisplayValue =
    effectiveCenter !== undefined
      ? getPredictionDisplayValue(effectiveCenter, {
          questionType: question.type,
          scaling: question.scaling,
          actual_resolve_time: question.actual_resolve_time ?? null,
          unit: question.unit,
        })
      : null;
  const communityPredictionDisplayValue =
    hideCP && rawCommunityPredictionDisplayValue !== null
      ? t("hidden")
      : rawCommunityPredictionDisplayValue;

  // Resolved/Annulled/Ambiguous
  if (question.resolution) {
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
    return (
      <QuestionContinuousResolutionChip
        formatedResolution={formatedResolution}
        formattedCP={communityPredictionDisplayValue}
      />
    );
  }

  return (
    <div className="flex max-w-[200px] flex-col items-center justify-center gap-3">
      <ContinuousCPBar
        communityPredictionDisplayValue={communityPredictionDisplayValue}
        isClosed={question.status === QuestionStatus.CLOSED}
        forecastAvailability={forecastAvailability}
        variant={variant}
      />
    </div>
  );
};

export default ConsumerContinuousTile;
