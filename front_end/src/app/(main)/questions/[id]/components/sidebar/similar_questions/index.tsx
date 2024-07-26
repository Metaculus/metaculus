import { FC } from "react";

import PostsApi from "@/services/posts";

import SimilarQuestionsDrawer from "./similar_questions_drawer";

type Props = {
  ids: number[];
};

export async function fetchMorePosts(ids: number[]) {
  const response = await PostsApi.getPostsWithCP({
    ids,
    order_by: "-forecasts_count",
  });
  return response.results;
}

const SimilarQuestions: FC<Props> = async ({ ids }) => {
  const questions = await fetchMorePosts(ids);

  if (questions.length === 0) return null;

  return <SimilarQuestionsDrawer questions={questions} />;
};

export default SimilarQuestions;
