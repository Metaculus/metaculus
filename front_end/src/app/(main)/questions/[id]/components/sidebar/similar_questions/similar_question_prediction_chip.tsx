"use client";

import { FC } from "react";

import ConsumerQuestionTile from "@/components/consumer_post_card/consumer_question_tile";
import GroupForecastCard from "@/components/consumer_post_card/group_forecast_card";
import PercentageForecastCard from "@/components/consumer_post_card/group_forecast_card/percentage_forecast_card";
import GroupOfQuestionsTile from "@/components/post_card/group_of_questions_tile";
import QuestionTile from "@/components/post_card/question_tile";
import { useHideCP } from "@/contexts/cp_context";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import {
  checkGroupOfQuestionsPostType,
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Props = {
  post: PostWithForecasts;
  variant?: "forecaster" | "consumer";
};

const SimilarPredictionChip: FC<Props> = ({ post, variant }) => {
  const { hideCP } = useHideCP();

  if (hideCP) {
    return null;
  }

  if (variant === "consumer") {
    if (
      isMultipleChoicePost(post) ||
      checkGroupOfQuestionsPostType(post, QuestionType.Binary)
    ) {
      return (
        <div className="w-full">
          <PercentageForecastCard post={post} forceColorful compact />
        </div>
      );
    }
    if (isGroupOfQuestionsPost(post)) {
      return (
        <div className="w-full">
          <GroupForecastCard post={post} compact />
        </div>
      );
    }
    if (isQuestionPost(post)) {
      return (
        <div className="flex w-full justify-center">
          <ConsumerQuestionTile question={post.question} />
        </div>
      );
    }
    return null;
  }

  // Forecaster view
  if (isMultipleChoicePost(post)) {
    return (
      <div className="w-full">
        <QuestionTile
          question={post.question}
          curationStatus={post.curation_status}
          authorUsername={post.author_username}
          hideCP={hideCP}
          canPredict={false}
          showChart={false}
        />
      </div>
    );
  }

  if (isQuestionPost(post)) {
    return (
      <div className="w-full">
        <QuestionTile
          question={post.question}
          curationStatus={post.curation_status}
          authorUsername={post.author_username}
          hideCP={hideCP}
          canPredict={false}
          showChart={true}
        />
      </div>
    );
  }

  if (isGroupOfQuestionsPost(post)) {
    return (
      <div className="w-full">
        <GroupOfQuestionsTile post={post} showChart={false} />
      </div>
    );
  }
};

export default SimilarPredictionChip;
