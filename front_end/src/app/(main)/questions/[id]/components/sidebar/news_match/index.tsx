import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ServerPostsApi from "@/services/api/posts/posts.server";

import NewsMatchDrawer from "./news_match_drawer";

interface Props {
  questionId: number;
}

const NewsMatch: FC<Props> = async ({ questionId }) => {
  const articles = await ServerPostsApi.getRelatedNews(questionId);

  if (articles.length > 0) {
    return <NewsMatchDrawer articles={articles} questionId={questionId} />;
  } else {
    return null;
  }
};

export default WithServerComponentErrorBoundary(NewsMatch);
