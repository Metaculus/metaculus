"use client";

import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isQuestionPost,
} from "@/utils/questions/helpers";
import { canPredictQuestion } from "@/utils/questions/predictions";

import GroupOfQuestionsPrediction from "./group_of_questions_prediction";
import SingleQuestionPrediction from "./single_question_prediction";

type Props = {
  postData: PostWithForecasts;
  className?: string;
};

const ConsumerQuestionPrediction: React.FC<Props> = ({
  postData,
  className,
}) => {
  const { user } = useAuth();

  if (isQuestionPost(postData) && !isMultipleChoicePost(postData)) {
    return (
      <SingleQuestionPrediction
        canPredict={canPredictQuestion(postData, user)}
        question={postData.question}
      />
    );
  }

  if (isMultipleChoicePost(postData) || isGroupOfQuestionsPost(postData)) {
    return (
      <GroupOfQuestionsPrediction postData={postData} className={className} />
    );
  }

  return null;
};

export default ConsumerQuestionPrediction;
