import { FC } from "react";

import PostsApi from "@/services/posts";

import NewsMatchDrawer from "./news_match_drawer";

interface Props {
  questionId: number;
}

const fetchArticles = async (postId: number) => {
  return await PostsApi.getRelatedNews(postId);
};

const NewsMatch: FC<Props> = async ({ questionId }) => {
  const articles = await fetchArticles(questionId);

  if (articles.length > 0) {
    return <NewsMatchDrawer articles={articles} questionId={questionId} />;
  }
};

export default NewsMatch;
