import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ServerPostsApi from "@/services/api/posts/posts.server";

import SimilarQuestionsDrawer from "./similar_questions_drawer";

type Props = {
  post_id: number;
};

const SimilarQuestions: FC<Props> = async ({ post_id }) => {
  const questions = await ServerPostsApi.getSimilarPosts(post_id);

  if (!questions.length) return null;

  return <SimilarQuestionsDrawer questions={questions} />;
};

export default WithServerComponentErrorBoundary(SimilarQuestions) as FC<Props>;
