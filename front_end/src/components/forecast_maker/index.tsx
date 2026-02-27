"use client";

import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useState } from "react";

import PredictionStatusMessage from "@/components/forecast_maker/prediction_status_message";
import { useAuth } from "@/contexts/auth_context";
import ClientPostsApi from "@/services/api/posts/posts.client";
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

  const [currentPost, setCurrentPost] = useState(post);

  // Sync local state when the prop changes (e.g., from server re-renders)
  useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  // Wrap onPredictionSubmit to fetch fresh post data (with updated CP)
  // after a prediction is submitted, matching the reaffirm flow pattern
  const handlePredictionSubmit = useCallback(async () => {
    try {
      const freshPost = await ClientPostsApi.getPost(currentPost.id);
      setCurrentPost(freshPost);
    } catch {
      // Silently fail - the CP will update on next page load
    }
    onPredictionSubmit?.();
  }, [currentPost.id, onPredictionSubmit]);

  const { group_of_questions: groupOfQuestions, conditional, question } = post;
  const canPredict = canPredictQuestion(post, user);
  const isPrePrediction = isPostPrePrediction(post);
  const predictLabel = isPrePrediction ? t("prePredict") : t("predict");

  const predictionMessage = <PredictionStatusMessage post={currentPost} />;

  if (groupOfQuestions) {
    return (
      <ForecastMakerGroup
        post={currentPost}
        questions={groupOfQuestions.questions}
        groupVariable={groupOfQuestions.group_variable}
        canPredict={canPredict}
        predictLabel={predictLabel}
        predictionMessage={predictionMessage}
        onPredictionSubmit={handlePredictionSubmit}
      />
    );
  }

  if (conditional) {
    return (
      <ForecastMakerConditional
        post={currentPost}
        conditional={conditional}
        canPredict={canPredict}
        predictLabel={predictLabel}
        predictionMessage={predictionMessage}
        onPredictionSubmit={handlePredictionSubmit}
      />
    );
  }

  if (question) {
    return (
      <QuestionForecastMaker
        question={question}
        canPredict={canPredict}
        predictLabel={predictLabel}
        post={currentPost}
        predictionMessage={predictionMessage}
        onPredictionSubmit={handlePredictionSubmit}
      />
    );
  }

  return null;
};

export default ForecastMaker;
