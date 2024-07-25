import { FC } from "react";

import { NewsArticle } from "@/types/news";

import { MOCK_NEWS_ARTICLES } from "./MOCK_NEWS_ARTICLES";
import NewsMatchDrawer from "./news_match_drawer";

interface Props {
  questionId: number;
  allowModifications?: boolean;
}

const fetchArticles = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const articles = await Promise.resolve(MOCK_NEWS_ARTICLES as NewsArticle[]);
  return articles;
};

const NewsMatch: FC<Props> = async ({ questionId, allowModifications }) => {
  const articles = await fetchArticles();

  return (
    <NewsMatchDrawer
      articles={articles}
      questionId={questionId}
      allowModifications={allowModifications}
    />
  );
};

export default NewsMatch;
