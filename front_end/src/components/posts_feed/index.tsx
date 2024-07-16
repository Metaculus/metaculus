import { FC } from "react";

import PaginatedPostsFeed, {
  PostsFeedType,
} from "@/components/posts_feed/paginated_feed";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import PostsApi, { PostsParams } from "@/services/posts";

type Props = {
  filters: PostsParams;
  type?: PostsFeedType;
};

const AwaitedPostsFeed: FC<Props> = async ({ filters, type }) => {
  const { results: questions, count } = await PostsApi.getPostsWithCP({
    ...filters,
    limit: POSTS_PER_PAGE,
  });

  return (
    <PaginatedPostsFeed
      filters={filters}
      initialQuestions={questions}
      totalCount={count}
      type={type}
    />
  );
};

export default AwaitedPostsFeed;
