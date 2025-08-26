import { FC, PropsWithChildren } from "react";
import { cache } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";

const hasRelatedNews = cache(async (questionId: number) => {
  const articles = await ServerPostsApi.getRelatedNews(questionId);
  return (articles?.length ?? 0) > 0;
});

type Props = { questionId: number };

const NewsPresence: FC<PropsWithChildren<Props>> = async ({
  questionId,
  children,
}) => {
  const hasNews = await hasRelatedNews(questionId);
  return hasNews ? <>{children}</> : null;
};

export default NewsPresence;
