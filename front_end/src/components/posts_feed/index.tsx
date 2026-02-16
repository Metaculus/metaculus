import { FC } from "react";

import PaginatedPostsFeed, {
  PostsFeedType,
} from "@/components/posts_feed/paginated_feed";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { PostsParams } from "@/services/api/posts/posts.shared";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { logError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

type Props = {
  filters: PostsParams;
  type?: PostsFeedType;
  isCommunity?: boolean;
  showProjectTiles?: boolean;
};

const AwaitedPostsFeed: FC<Props> = async ({
  filters,
  type,
  isCommunity,
  showProjectTiles,
}) => {
  const { PUBLIC_MINIMAL_UI } = getPublicSettings();
  const skipTiles = !showProjectTiles || isCommunity || PUBLIC_MINIMAL_UI;

  const [{ results: questions }, projectTiles] = await Promise.all([
    ServerPostsApi.getPostsWithCP({
      ...filters,
      limit:
        (!isNaN(Number(filters.page)) ? Number(filters.page) : 1) *
        POSTS_PER_PAGE,
    }),
    skipTiles
      ? Promise.resolve([])
      : ServerProjectsApi.getFeedTiles().catch((err) => {
          logError(err);
          return [];
        }),
  ]);

  return (
    <PaginatedPostsFeed
      filters={filters}
      initialQuestions={questions}
      initialProjectTiles={projectTiles}
      type={type}
      isCommunity={isCommunity}
    />
  );
};

export default WithServerComponentErrorBoundary(AwaitedPostsFeed);
