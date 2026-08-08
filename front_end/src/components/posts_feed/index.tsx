import { FC } from "react";

import { FiltersFromSearchParamsOptions } from "@/app/(main)/questions/helpers/filters";
import { FeedQueryProvider } from "@/app/(main)/questions/hooks/use_feed_query";
import PaginatedPostsFeed, {
  PostsFeedType,
} from "@/components/posts_feed/paginated_feed";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { FeedLayout } from "@/components/ui/layout_switcher";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { PostsParams } from "@/services/api/posts/posts.shared";
import { logError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

type Props = {
  filters: PostsParams;
  type?: PostsFeedType;
  isCommunity?: boolean;
  showProjectTiles?: boolean;
  forceLayout?: FeedLayout;
  clientFilterOptions?: FiltersFromSearchParamsOptions;
  isFeedQueryProvided?: boolean;
};

function getHydrationPageNumber(page: PostsParams["page"]) {
  const pageNumber = Number(page);

  return Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
}

const AwaitedPostsFeed: FC<Props> = async ({
  filters,
  type,
  isCommunity,
  showProjectTiles,
  forceLayout,
  clientFilterOptions,
  isFeedQueryProvided,
}) => {
  const { PUBLIC_MINIMAL_UI } = getPublicSettings();
  const skipTiles = !showProjectTiles || isCommunity || PUBLIC_MINIMAL_UI;
  const hydrationPageNumber = getHydrationPageNumber(filters.page);

  const [{ count, results: questions }, projectTiles] = await Promise.all([
    ServerPostsApi.getPostsWithCP({
      ...filters,
      limit: hydrationPageNumber * POSTS_PER_PAGE,
    }),
    skipTiles
      ? Promise.resolve([])
      : serverMiscApi.getCombinedFeedTiles().catch((err) => {
          logError(err);
          return [];
        }),
  ]);

  const feed = (
    <PaginatedPostsFeed
      filters={filters}
      initialQuestions={questions}
      initialCount={count}
      initialProjectTiles={projectTiles}
      type={type}
      isCommunity={isCommunity}
      forceLayout={forceLayout}
      clientFilterOptions={clientFilterOptions}
    />
  );

  return isFeedQueryProvided ? (
    feed
  ) : (
    <FeedQueryProvider filterOptions={clientFilterOptions}>
      {feed}
    </FeedQueryProvider>
  );
};

export default WithServerComponentErrorBoundary(AwaitedPostsFeed);
