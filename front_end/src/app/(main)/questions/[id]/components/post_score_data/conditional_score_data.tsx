import React, { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import SingleQuestionScoreData from "./single_question_score_data";

type Props = {
  post: PostWithForecasts;
  isConsumerView?: boolean;
  noSectionWrapper?: boolean;
};

const ConditionalScoreData: FC<Props> = ({
  post,
  isConsumerView,
  noSectionWrapper,
}) => {
  if (!post.conditional) return null;

  const { condition, question_yes, question_no } = post.conditional;
  let effectivePost: PostWithForecasts | null = null;

  if (condition.resolution === "yes") {
    effectivePost = {
      ...post,
      question: question_yes,
      conditional: undefined,
    } as unknown as PostWithForecasts;
  } else if (condition.resolution === "no") {
    effectivePost = {
      ...post,
      question: question_no,
      conditional: undefined,
    } as unknown as PostWithForecasts;
  }

  if (!effectivePost) return null;

  return (
    <SingleQuestionScoreData
      post={effectivePost}
      isConsumerView={isConsumerView}
      noSectionWrapper={noSectionWrapper}
      hideParticipation
    />
  );
};

export default ConditionalScoreData;
