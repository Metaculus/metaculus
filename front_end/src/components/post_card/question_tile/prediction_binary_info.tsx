import { useLocale } from "next-intl";
import React, { FC } from "react";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionResolutionChip from "@/components/consumer_post_card/question_resolution_chip";
import QuestionCPMovement from "@/components/cp_movement";
import MyPredictionChip from "@/components/my_prediction_chip";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts, UserForecast } from "@/types/question";
import { formatResolution } from "@/utils/formatters/resolution";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  question: QuestionWithNumericForecasts;
  onReaffirm?: (userForecast: UserForecast) => void;
  canPredict?: boolean;
};

const PredictionBinaryInfo: FC<Props> = ({
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
      <BinaryCPBar question={question} size="sm" />
      <QuestionCPMovement
        question={question}
        className="mx-auto max-w-[110px] text-center"
        size={"xs"}
      />
      <MyPredictionChip
        question={question}
        showUserForecast
        onReaffirm={onReaffirm}
        canPredict={canPredict}
      />
    </>
  );
};

export default PredictionBinaryInfo;
