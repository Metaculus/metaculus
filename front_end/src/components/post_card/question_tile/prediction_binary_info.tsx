import { FC } from "react";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionCPMovement from "@/components/cp_movement";
import MyPredictionChip from "@/components/my_prediction_chip";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts, UserForecast } from "@/types/question";

type Props = {
  question: QuestionWithNumericForecasts;
  renderResolutionStatus: (
    question: QuestionWithNumericForecasts
  ) => React.ReactNode;
  onReaffirm?: (userForecast: UserForecast) => void;
  canPredict?: boolean;
  showMyPrediction?: boolean;
  size?: "sm" | "lg";
  cpMovementVariant?: "chip" | "message";
};

const PredictionBinaryInfo: FC<Props> = ({
  question,
  renderResolutionStatus,
  onReaffirm,
  canPredict,
  showMyPrediction,
  cpMovementVariant = "message",
  size = "sm",
}) => {
  if (question.status === QuestionStatus.RESOLVED && question.resolution) {
    // Resolved/Annulled/Ambiguous
    return renderResolutionStatus(question);
  }

  return (
    <>
      <BinaryCPBar question={question} size={size} />
      <QuestionCPMovement
        question={question}
        className="mx-auto max-w-[110px] justify-center text-center"
        size={size === "sm" ? "xs" : "sm"}
        boldValueUnit={true}
        variant={cpMovementVariant}
      />
      {showMyPrediction && (
        <MyPredictionChip
          question={question}
          showUserForecast
          onReaffirm={onReaffirm}
          canPredict={canPredict}
        />
      )}
    </>
  );
};

export default PredictionBinaryInfo;
