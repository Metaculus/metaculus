import { FC } from "react";

import PostsApi from "@/services/posts";

import NewsMatchDrawer from "./news_match_drawer";

interface Props {
  questionId: number;
}

const fetchArticles = async (postId: number) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return await PostsApi.getRelatedNews(postId);
};

const NewsMatch: FC<Props> = async ({ questionId }) => {
  const articles = await fetchArticles(questionId);

  return <NewsMatchDrawer articles={articles} questionId={questionId} />;
};

export default NewsMatch;
