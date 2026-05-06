import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ServerPostsApi from "@/services/api/posts/posts.server";

import SimilarQuestionsList from "./similar_questions_list";

type Props = {
  post_id: number;
  variant?: "forecaster" | "consumer";
};

const SimilarQuestions: FC<Props> = async ({ post_id, variant }) => {
  let questions = await ServerPostsApi.getSimilarPosts(post_id);

  if (!questions.length) {
    const { results } = await ServerPostsApi.getPostsWithCP({
      topic: "top-50",
      for_main_feed: "false",
      order_by: "-hotness",
      limit: 8,
    });
    questions = results.filter((q) => q.id !== post_id);
  }

  if (!questions.length) return null;

  return <SimilarQuestionsList questions={questions} variant={variant} />;
};

export default WithServerComponentErrorBoundary(SimilarQuestions) as FC<Props>;
