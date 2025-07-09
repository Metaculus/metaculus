import { useLocale } from "next-intl";
import React, { FC } from "react";

import QuestionResolutionChip from "@/components/consumer_post_card/question_resolution_chip";
import QuestionCPMovement from "@/components/cp_movement";
import MyPredictionChip from "@/components/my_prediction_chip";
import ContinuousCPBar from "@/components/post_card/question_tile/continuous_cp_bar";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts, UserForecast } from "@/types/question";
import { formatResolution } from "@/utils/formatters/resolution";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  question: QuestionWithNumericForecasts;
  onReaffirm?: (userForecast: UserForecast) => void;
  canPredict?: boolean;
};

const PredictionContinuousInfo: FC<Props> = ({
  question,
  onReaffirm,
  canPredict,
}) => {
  const locale = useLocale();

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
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <ContinuousCPBar question={question} />
        <QuestionCPMovement
          question={{ ...question, unit: "" }}
          className="mx-auto max-w-[110px]"
          size={"xs"}
        />
      </div>
      <MyPredictionChip
        question={question}
        showUserForecast
        onReaffirm={onReaffirm}
        canPredict={canPredict}
      />
    </>
  );
};

export default PredictionContinuousInfo;
