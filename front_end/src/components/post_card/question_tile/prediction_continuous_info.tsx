import { useLocale } from "next-intl";
import React, { FC } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import QuestionResolutionChip from "@/components/consumer_post_card/question_resolution_chip";
import QuestionCPMovement from "@/components/cp_movement";
import MyPredictionChip from "@/components/my_prediction_chip";
import ContinuousCPBar from "@/components/post_card/question_tile/continuous_cp_bar";
import { useHideCP } from "@/contexts/cp_context";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts, UserForecast } from "@/types/question";
import { formatResolution } from "@/utils/formatters/resolution";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  question: QuestionWithNumericForecasts;
  onReaffirm?: (userForecast: UserForecast) => void;
  canPredict?: boolean;
  showMyPrediction?: boolean;
};

const PredictionContinuousInfo: FC<Props> = ({
  question,
  onReaffirm,
  canPredict,
  showMyPrediction,
}) => {
  const locale = useLocale();
  const { hideCP } = useHideCP();

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

    // Only hide chip for successfully resolved continuous questions
    // Show chip for Ambiguous/Annulled questions
    if (successfullyResolved) {
      return null; // Let chart handle successfully resolved display
    }

    return (
      <QuestionResolutionChip
        formatedResolution={formatedResolution}
        successfullyResolved={successfullyResolved}
        unit={question.unit}
      />
    );
  }

  return (
    <div className="flex w-full flex-row gap-1.5 md:flex-col md:gap-0.5">
      <div className="flex w-full flex-col gap-1 md:gap-1.5">
        {!hideCP && (
          <>
            <ContinuousCPBar question={question} />
            <QuestionCPMovement
              question={question}
              className="mx-auto max-w-[200px] md:mx-0"
              size={"xs"}
              boldValueUnit={true}
            />
          </>
        )}
        {hideCP && (
          <ForecastersCounter
            forecasters={
              question.aggregations[question.default_aggregation_method]?.latest
                ?.forecaster_count ?? undefined
            }
            className="mx-auto md:mx-0"
          />
        )}
      </div>
      {showMyPrediction && question.my_forecasts?.latest && (
        <div className="mt-0 flex w-full w-full  border-0 border-dashed border-gray-300 pt-0 dark:border-gray-300-dark md:mt-1 md:border-t-[0.5px] md:pt-2">
          <MyPredictionChip
            question={question}
            showUserForecast
            onReaffirm={onReaffirm}
            canPredict={canPredict}
            variant="continuous"
          />
        </div>
      )}
    </div>
  );
};

export default PredictionContinuousInfo;
