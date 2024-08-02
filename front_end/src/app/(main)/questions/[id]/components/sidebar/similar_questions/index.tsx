import { FC } from "react";

import PostsApi from "@/services/posts";
import { QuestionOrder } from "@/types/question";

import SimilarQuestionsDrawer from "./similar_questions_drawer";

type Props = {
  post_id: number;
};

const SimilarQuestions: FC<Props> = async ({ post_id }) => {
  const response = await PostsApi.getPostsWithCP({
    similar_to_post_id: post_id,
    order_by: QuestionOrder.PredictionCountDesc,
  });
  const { results: questions } = response;

  if (!questions.length) return null;

  return <SimilarQuestionsDrawer questions={questions} />;
};

export default SimilarQuestions;
