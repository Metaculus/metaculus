import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ServerPostsApi from "@/services/api/posts/posts.server";

import SimilarQuestionsList from "./similar_questions_list";

type Props = {
  post_id: number;
  variant?: "forecaster" | "consumer";
};

const SimilarQuestions: FC<Props> = async ({ post_id, variant }) => {
  const questions = await ServerPostsApi.getSimilarPosts(post_id);

  if (!questions.length) return null;

  return <SimilarQuestionsList questions={questions} variant={variant} />;
};

export default WithServerComponentErrorBoundary(SimilarQuestions) as FC<Props>;
