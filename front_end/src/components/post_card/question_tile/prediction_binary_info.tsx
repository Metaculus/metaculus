import { FC } from "react";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionCPMovement from "@/components/cp_movement";
import MyPredictionChip from "@/components/my_prediction_chip";
import { useHideCP } from "@/contexts/cp_context";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts, UserForecast } from "@/types/question";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";

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
  const { hideCP } = useHideCP();

  if (question.status === QuestionStatus.RESOLVED && question.resolution) {
    // Resolved/Annulled/Ambiguous
    return renderResolutionStatus(question);
  }

  return (
    <div className="flex w-full flex-col items-center gap-0.5">
      <div
        className={cn("flex w-full flex-col items-center justify-center", {
          "gap-4": size === "lg", // Add gap for large size to accommodate scale
        })}
      >
        <BinaryCPBar question={question} size={size} />
        {!hideCP && (
          <QuestionCPMovement
            question={question}
            className={cn("mx-auto max-w-[110px] justify-center text-center")}
            size={size === "sm" ? "xs" : "sm"}
            boldValueUnit
            variant={cpMovementVariant}
          />
        )}
      </div>

      {showMyPrediction &&
        question.my_forecasts?.latest &&
        isForecastActive(question.my_forecasts.latest) && (
          <div className="mt-1 w-full border-t-[0.5px] border-dashed border-gray-300 pt-2 dark:border-gray-300-dark">
            <MyPredictionChip
              question={question}
              showUserForecast
              onReaffirm={onReaffirm}
              canPredict={canPredict}
              variant="binary"
            />
          </div>
        )}
    </div>
  );
};

export default PredictionBinaryInfo;
