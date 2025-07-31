"use client";

import { isNil } from "lodash";

import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";
import { isConditionalPost, isNotebookPost } from "@/utils/questions/helpers";

import ConsumerQuestionView from "./consumer_question_view";
import ForecasterQuestionView from "./forecaster_question_view";

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId: number | undefined;
  variant?: "forecaster" | "consumer";
};

const QuestionView: React.FC<Omit<Props, "variant">> = ({
  postData,
  preselectedGroupQuestionId,
}) => {
  const { user } = useAuth();
  const variant =
    isNil(user) && !isNotebookPost(postData) && !isConditionalPost(postData)
      ? "consumer"
      : "forecaster";

  return (
    <QuestionViewComponent
      postData={postData}
      preselectedGroupQuestionId={preselectedGroupQuestionId}
      variant={variant}
    />
  );
};

export const QuestionViewComponent: React.FC<Props> = ({
  postData,
  preselectedGroupQuestionId,
  variant = "forecaster",
}) => {
  if (variant === "consumer") {
    return <ConsumerQuestionView postData={postData} />;
  }
  return (
    <ForecasterQuestionView
      postData={postData}
      preselectedGroupQuestionId={preselectedGroupQuestionId}
    />
  );
};

export default QuestionView;
