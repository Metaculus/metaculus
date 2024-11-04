import { FC } from "react";

import PaginatedPostsFeed, {
  PostsFeedType,
} from "@/components/posts_feed/paginated_feed";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import PostsApi, { PostsParams } from "@/services/posts";
import { Topic } from "@/types/projects";

type Props = {
  filters: PostsParams;
  type?: PostsFeedType;
  topics?: Topic[];
  isCommunity?: boolean;
};

const AwaitedPostsFeed: FC<Props> = async ({
  filters,
  type,
  topics,
  isCommunity,
}) => {
  if (
    topics &&
    filters.topic &&
    !topics?.some((topic) => topic.slug === filters.topic)
  ) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-500-dark">
        Such topic does not exist
      </div>
    );
  }

  const { results: questions } = await PostsApi.getPostsWithCP({
    ...filters,
    limit: POSTS_PER_PAGE,
  });

  return (
    <PaginatedPostsFeed
      filters={filters}
      initialQuestions={questions}
      type={type}
      isCommunity={isCommunity}
    />
  );
};

export default WithServerComponentErrorBoundary(AwaitedPostsFeed);
