import { useLocale } from "next-intl";
import { FC } from "react";

import ContinuousCPBar from "@/components/consumer_post_card/consumer_question_tile/continuous_cp_bar";
import QuestionContinuousResolutionChip from "@/components/consumer_post_card/question_continuous_resolution_chip";
import { QuestionStatus } from "@/types/post";
import { ForecastAvailability, QuestionWithForecasts } from "@/types/question";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { formatResolution } from "@/utils/formatters/resolution";

type Props = {
  question: QuestionWithForecasts;
  forecastAvailability: ForecastAvailability;
};

const ConsumerContinuousTile: FC<Props> = ({
  question,
  forecastAvailability,
}) => {
  const locale = useLocale();

  const latest =
    question.aggregations[question.default_aggregation_method]?.latest;
  const communityPredictionDisplayValue = latest
    ? getPredictionDisplayValue(latest.centers?.[0], {
        questionType: question.type,
        scaling: question.scaling,
        actual_resolve_time: question.actual_resolve_time ?? null,
        unit: question.unit,
      })
    : null;

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
      />
    </div>
  );
};

export default ConsumerContinuousTile;
