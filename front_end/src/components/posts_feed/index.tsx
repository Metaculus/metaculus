import { FC } from "react";

import PaginatedPostsFeed, {
  PostsFeedType,
} from "@/components/posts_feed/paginated_feed";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { PostsParams } from "@/services/api/posts/posts.shared";

type Props = {
  filters: PostsParams;
  type?: PostsFeedType;
  isCommunity?: boolean;
};

const AwaitedPostsFeed: FC<Props> = async ({ filters, type, isCommunity }) => {
  return <div>Paginated Post Feed</div>;

  // If I comment this below, the page loads fine.
  const questions = [];
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
