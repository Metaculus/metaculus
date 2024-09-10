import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import PostsApi from "@/services/posts";

import SimilarQuestionsDrawer from "./similar_questions_drawer";

type Props = {
  post_id: number;
};

const SimilarQuestions: FC<Props> = async ({ post_id }) => {
  const questions = await PostsApi.getSimilarPosts(post_id);

  if (!questions.length) return null;

  return <SimilarQuestionsDrawer questions={questions} />;
};

export default WithServerComponentErrorBoundary(SimilarQuestions) as FC<Props>;
