import { FC, ReactNode } from "react";

import { PostWithForecasts } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { sortGroupPredictionOptions } from "@/utils/questions";

import ForecastMakerGroupBinary from "./forecast_maker_group_binary";
import ForecastMakerGroupContinuous from "./forecast_maker_group_continuous";
import ForecastMakerContainer from "../container";

type Props = {
  questions: QuestionWithForecasts[];
  post: PostWithForecasts;
  groupVariable: string;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage: ReactNode;
};

const ForecastMakerGroup: FC<Props> = ({
  post,
  questions,
  groupVariable,
  canResolve,
  canPredict,
  predictionMessage,
}) => {
  const tileType = questions.at(0)?.type;

  if (!tileType) {
    return null;
  }

  return (
    <ForecastMakerContainer>
      {tileType === QuestionType.Binary && (
        <ForecastMakerGroupBinary
          post={post}
          questions={sortGroupPredictionOptions(
            questions as QuestionWithNumericForecasts[]
          )}
          groupVariable={groupVariable}
          canResolve={canResolve}
          canPredict={canPredict}
          predictionMessage={predictionMessage}
        />
      )}
      {(tileType === QuestionType.Date ||
        tileType === QuestionType.Numeric) && (
        <ForecastMakerGroupContinuous
          post={post}
          questions={questions as QuestionWithNumericForecasts[]}
          groupVariable={groupVariable}
          canResolve={canResolve}
          canPredict={canPredict}
          predictionMessage={predictionMessage}
        />
      )}
    </ForecastMakerContainer>
  );
};

export default ForecastMakerGroup;
