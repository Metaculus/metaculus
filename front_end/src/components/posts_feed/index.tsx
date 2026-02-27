import { FC } from "react";

import PaginatedPostsFeed, {
  PostsFeedType,
} from "@/components/posts_feed/paginated_feed";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { PostsParams } from "@/services/api/posts/posts.shared";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { FeedProjectTile } from "@/types/projects";
import { logError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

type Props = {
  filters: PostsParams;
  type?: PostsFeedType;
  isCommunity?: boolean;
  showProjectTiles?: boolean;
  searchText?: string;
};

const AwaitedPostsFeed: FC<Props> = async ({
  filters,
  type,
  isCommunity,
  showProjectTiles,
  searchText,
}) => {
  const { PUBLIC_MINIMAL_UI } = getPublicSettings();
  const skipTiles = !showProjectTiles || isCommunity || PUBLIC_MINIMAL_UI;
  const isSearchMode = !!searchText && !skipTiles;

  const [{ results: questions }, feedTiles, searchedTournaments] =
    await Promise.all([
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
      isSearchMode
        ? ServerProjectsApi.getTournaments({ search: searchText }).catch(
            (err) => {
              logError(err);
              return [];
            }
          )
        : Promise.resolve([]),
    ]);

  let projectTiles: FeedProjectTile[] = [];

  if (isSearchMode && searchedTournaments.length) {
    const feedTileMap = new Map(
      feedTiles.map((tile, index) => [tile.project_id, { tile, index }])
    );

    projectTiles = searchedTournaments
      .map((tournament) => {
        const rawRank = tournament.rank ?? 0;
        const feedTileEntry = feedTileMap.get(tournament.id);
        if (feedTileEntry) {
          const weight = 0.5 + Math.max(0, 4 - feedTileEntry.index) / 40;
          return { ...feedTileEntry.tile, rank: rawRank * weight };
        }
        return {
          project: tournament,
          project_id: tournament.id,
          recently_opened_questions: 0,
          recently_resolved_questions: 0,
          all_questions_resolved: false,
          project_resolution_date: null,
          rule: null,
          rank: rawRank * 0.5,
        };
      })
      .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));
  } else if (!skipTiles) {
    projectTiles = feedTiles;
  }

  return (
    <PaginatedPostsFeed
      filters={filters}
      initialQuestions={questions}
      initialProjectTiles={projectTiles}
      type={type}
      isCommunity={isCommunity}
      isSearchMode={isSearchMode}
    />
  );
};

export default WithServerComponentErrorBoundary(AwaitedPostsFeed);
