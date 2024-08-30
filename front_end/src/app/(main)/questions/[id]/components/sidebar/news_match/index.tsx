import { FC } from "react";

import PostsApi from "@/services/posts";

import NewsMatchDrawer from "./news_match_drawer";
import ServerComponentErrorBoundary from "@/components/server_component_error_boundary";

interface Props {
  questionId: number;
}

const fetchArticles = async (postId: number) => {
  return await PostsApi.getRelatedNews(postId);
};

const NewsMatch: FC<Props> = async ({ questionId }) => {
  return ServerComponentErrorBoundary(async () => {
    const articles = await fetchArticles(questionId);

    if (articles.length > 0) {
      return <NewsMatchDrawer articles={articles} questionId={questionId} />;
    } else {
      return null;
    }
  });
};

export default NewsMatch;
