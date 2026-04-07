"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import PredictionStatusMessage from "@/components/forecast_maker/prediction_status_message";
import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";
import {
  canPredictQuestion,
  isPostPrePrediction,
} from "@/utils/questions/predictions";

import ForecastMakerConditional from "./forecast_maker_conditional";
import ForecastMakerGroup from "./forecast_maker_group";
import QuestionForecastMaker from "./forecast_maker_question";

type Props = {
  post: PostWithForecasts;
  onPredictionSubmit?: () => void;
};

const ForecastMaker: FC<Props> = ({ post, onPredictionSubmit }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { group_of_questions: groupOfQuestions, conditional, question } = post;
  const canPredict = canPredictQuestion(post, user);
  const isPrePrediction = isPostPrePrediction(post);
  const predictLabel = isPrePrediction ? t("prePredict") : t("predict");

  const predictionMessage = <PredictionStatusMessage post={post} />;

  if (groupOfQuestions) {
    return (
      <ForecastMakerGroup
        post={post}
        questions={groupOfQuestions.questions}
        groupVariable={groupOfQuestions.group_variable}
        canPredict={canPredict}
        predictLabel={predictLabel}
        predictionMessage={predictionMessage}
        onPredictionSubmit={onPredictionSubmit}
      />
    );
  }

  if (conditional) {
    return (
      <ForecastMakerConditional
        post={post}
        conditional={conditional}
        canPredict={canPredict}
        predictLabel={predictLabel}
        predictionMessage={predictionMessage}
        onPredictionSubmit={onPredictionSubmit}
      />
    );
  }

  if (question) {
    return (
      <QuestionForecastMaker
        question={question}
        canPredict={canPredict}
        predictLabel={predictLabel}
        post={post}
        predictionMessage={predictionMessage}
        onPredictionSubmit={onPredictionSubmit}
      />
    );
  }

  return null;
};

export default ForecastMaker;
