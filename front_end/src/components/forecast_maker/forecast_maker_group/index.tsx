import { FC, ReactNode } from "react";

import { ContinuousQuestionTypes } from "@/constants/questions";
import { PostWithForecasts } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { sortGroupPredictionOptions } from "@/utils/questions/groupOrdering";

import ForecastMakerGroupBinary from "./forecast_maker_group_binary";
import ForecastMakerGroupContinuous from "./forecast_maker_group_continuous";
import ForecastMakerContainer from "../container";

type Props = {
  questions: QuestionWithForecasts[];
  post: PostWithForecasts;
  groupVariable: string;
  canPredict: boolean;
  predictionMessage: ReactNode;
  onPredictionSubmit?: () => void;
};

const ForecastMakerGroup: FC<Props> = ({
  post,
  questions,
  groupVariable,
  canPredict,
  predictionMessage,
  onPredictionSubmit,
}) => {
  const tileType = questions.at(0)?.type;

  if (!tileType) {
    return null;
  }

  const sortedQuestions = sortGroupPredictionOptions(
    questions as QuestionWithNumericForecasts[],
    post.group_of_questions
  );

  return (
    <ForecastMakerContainer>
      {tileType === QuestionType.Binary && (
        <ForecastMakerGroupBinary
          post={post}
          questions={sortedQuestions}
          groupVariable={groupVariable}
          canPredict={canPredict}
          predictionMessage={predictionMessage}
          onPredictionSubmit={onPredictionSubmit}
        />
      )}
      {ContinuousQuestionTypes.some((type) => type === tileType) && (
        <ForecastMakerGroupContinuous
          post={post}
          questions={sortedQuestions}
          groupVariable={groupVariable}
          canPredict={canPredict}
          predictionMessage={predictionMessage}
          onPredictionSubmit={onPredictionSubmit}
        />
      )}
    </ForecastMakerContainer>
  );
};

export default ForecastMakerGroup;
