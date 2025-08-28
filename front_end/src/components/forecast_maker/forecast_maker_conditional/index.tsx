import { FC, ReactNode } from "react";

import { ContinuousQuestionTypes } from "@/constants/questions";
import { PostConditional, PostWithForecasts } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

import ForecastMakerConditionalBinary from "./forecast_maker_conditional_binary";
import ForecastMakerConditionalContinuous from "./forecast_maker_conditional_continuous";
import ForecastMakerContainer from "../container";

type Props = {
  post: PostWithForecasts;
  conditional: PostConditional<QuestionWithForecasts>;
  canPredict: boolean;
  predictionMessage: ReactNode;
  onPredictionSubmit?: () => void;
};

const ForecastMakerConditional: FC<Props> = ({
  post,
  conditional,
  canPredict,
  predictionMessage,
  onPredictionSubmit,
}) => {
  const { id: postId, title: postTitle, projects } = post;
  const { question_yes, question_no } = conditional;

  if (question_yes.type !== question_no.type) {
    return null;
  }

  return (
    <ForecastMakerContainer>
      {question_yes.type === QuestionType.Binary && (
        <ForecastMakerConditionalBinary
          postId={postId}
          postTitle={postTitle}
          conditional={
            conditional as PostConditional<QuestionWithNumericForecasts>
          }
          canPredict={canPredict}
          predictionMessage={predictionMessage}
          projects={projects}
          onPredictionSubmit={onPredictionSubmit}
        />
      )}
      {ContinuousQuestionTypes.some((type) => type === question_yes.type) && (
        <ForecastMakerConditionalContinuous
          postId={postId}
          postTitle={postTitle}
          conditional={
            conditional as PostConditional<QuestionWithNumericForecasts>
          }
          canPredict={canPredict}
          predictionMessage={predictionMessage}
          projects={projects}
          onPredictionSubmit={onPredictionSubmit}
        />
      )}
    </ForecastMakerContainer>
  );
};

export default ForecastMakerConditional;
