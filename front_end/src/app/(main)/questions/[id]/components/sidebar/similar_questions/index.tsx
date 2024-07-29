import { FC } from "react";

import PostsApi from "@/services/posts";
import { QuestionOrder } from "@/types/question";

import SimilarQuestionsDrawer from "./similar_questions_drawer";

type Props = {
  ids: number[];
};

const SimilarQuestions: FC<Props> = async ({ ids }) => {
  const response = await PostsApi.getPostsWithCP({
    ids,
    order_by: QuestionOrder.PredictionCountDesc,
  });
  const { results: questions } = response;

  if (!questions.length) return null;

  return <SimilarQuestionsDrawer questions={questions} />;
};

export default SimilarQuestions;
