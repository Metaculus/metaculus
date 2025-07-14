import { FC } from "react";

import ContinuousCPBar from "@/components/consumer_post_card/continuous_cp_bar";
import QuestionCPMovement from "@/components/cp_movement";
import { QuestionStatus } from "@/types/post";
import { ForecastAvailability, QuestionWithForecasts } from "@/types/question";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";

type Props = {
  question: QuestionWithForecasts;
  forecastAvailability: ForecastAvailability;
};

const ConsumerContinuousTile: FC<Props> = ({
  question,
  forecastAvailability,
}) => {
  const isClosed = question.status === QuestionStatus.CLOSED;
  const latest = question.aggregations.recency_weighted.latest;
  const communityPredictionDisplayValue = latest
    ? getPredictionDisplayValue(latest.centers?.[0], {
        questionType: question.type,
        scaling: question.scaling,
        actual_resolve_time: question.actual_resolve_time ?? null,
      })
    : null;

  return (
    <div className="flex max-w-[200px] flex-col items-center justify-center gap-3">
      <ContinuousCPBar
        communityPredictionDisplayValue={communityPredictionDisplayValue}
        unit={question.unit}
        isClosed={isClosed}
      />

      <QuestionCPMovement question={question} presentation="consumerView" />
    </div>
  );
};

export default ConsumerContinuousTile;
