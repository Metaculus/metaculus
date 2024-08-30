import { FC } from "react";

import PaginatedPostsFeed, {
  PostsFeedType,
} from "@/components/posts_feed/paginated_feed";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import PostsApi, { PostsParams } from "@/services/posts";
import ServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { Topic } from "@/types/projects";

type Props = {
  filters: PostsParams;
  type?: PostsFeedType;
  topics?: Topic[];
};

const AwaitedPostsFeed: FC<Props> = async ({ filters, type, topics }) => {
  return ServerComponentErrorBoundary(async () => {
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
  });
};

export default AwaitedPostsFeed;
