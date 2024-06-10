import { FC } from "react";

import PaginatedPostsFeed from "@/components/posts_feed/paginated_feed";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import PostsApi, { PostsParams } from "@/services/posts";

type Props = {
  filters: PostsParams;
};

const AwaitedPostsFeed: FC<Props> = async ({ filters }) => {
  const { results: questions, count } = await PostsApi.getPostWithoutForecasts({
    ...filters,
    limit: POSTS_PER_PAGE,
  });

  return (
    <PaginatedPostsFeed
      filters={filters}
      initialQuestions={questions}
      totalCount={count}
    />
  );
};

export default AwaitedPostsFeed;
