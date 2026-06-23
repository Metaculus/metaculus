"use client";
import { useTranslations } from "next-intl";
import { FC, memo, useEffect, useMemo, useState } from "react";

import { QuestionVariantComposer } from "@/app/(main)/questions/[id]/components/question_variant_composer";
import { FiltersFromSearchParamsOptions } from "@/app/(main)/questions/helpers/filters";
import { useFeedQuery } from "@/app/(main)/questions/hooks/use_feed_query";
import { setSearchParamValue } from "@/app/(main)/questions/hooks/use_feed_query_params";
import ConsumerPostCard from "@/components/consumer_post_card";
import NewsCard from "@/components/news_card";
import PostCard from "@/components/post_card";
import CompactSearchPostCard from "@/components/post_card/compact_search_post_card";
import Button from "@/components/ui/button";
import { type FeedLayout } from "@/components/ui/layout_switcher";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { Masonry, useMediaValues } from "@/components/ui/masonry";
import VirtualizedMasonry from "@/components/ui/virtualized_masonry";
import { POST_PAGE_FILTER, POSTS_PER_PAGE } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import { useFeedLayout } from "@/contexts/feed_layout_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import useMounted from "@/hooks/use_mounted";
import { PostsParams } from "@/services/api/posts/posts.shared";
import { PostWithForecasts } from "@/types/post";
import { FeedProjectTile } from "@/types/projects";
import { InterfaceType } from "@/types/users";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";
import { getPageNumberFromParam } from "@/utils/posts_feed";
import { isNotebookPost } from "@/utils/questions/helpers";

import { FeedItem, buildFeedItems, getFeedItemKey } from "./build_feed_items";
import EmptyCommunityFeed from "./empty_community_feed";
import PostsFeedScrollRestoration from "./feed_scroll_restoration";
import FeedTournamentTile from "./feed_tournament_tile";
import {
  normalizePostsFeedFilters,
  useFeedProjectTilesQuery,
  usePostsFeedQuery,
} from "./hooks/use_posts_feed_query";
import InReviewBox from "./in_review_box";
import { FormErrorMessage } from "../ui/form_field";

export type PostsFeedType = "posts" | "news";

const EMPTY_INDEX_WEIGHTS: Record<string, number> = {};
const EMPTY_PROJECT_TILES: FeedProjectTile[] = [];
const GRID_COLUMNS = [1, 2, 3];
const GRID_GAPS = [12, 12, 12];
const GRID_MEDIA = [1024, 1280, 1536];
const GRID_OVERSCAN = 9;

function shouldShowProjectTilesForParams(params: URLSearchParams) {
  return Array.from(params.keys()).every((key) => key === POST_PAGE_FILTER);
}

function estimateFeedItemSize(item: FeedItem) {
  if (item.type === "project") return 360;
  if (isNotebookPost(item.post)) return 220;
  return 440;
}

type Props = {
  initialQuestions: PostWithForecasts[];
  initialCount?: number;
  initialProjectTiles?: FeedProjectTile[];
  filters: PostsParams;
  type?: PostsFeedType;
  isCommunity?: boolean;
  indexWeights?: Record<string, number>;
  forceLayout?: FeedLayout;
  clientFilterOptions?: FiltersFromSearchParamsOptions;
  useInitialData?: boolean;
};

const PaginatedPostsFeed: FC<Props> = ({
  initialQuestions,
  initialCount,
  initialProjectTiles = [],
  filters,
  type = "posts",
  isCommunity,
  indexWeights = EMPTY_INDEX_WEIGHTS,
  forceLayout,
  clientFilterOptions,
  useInitialData = true,
}) => {
  const t = useTranslations();
  const mounted = useMounted();
  const { user } = useAuth();
  const {
    params: feedQueryParams,
    filters: clientQueryFilters,
    setPageParams,
    setResultCount,
  } = useFeedQuery();
  const pageNumberParam = feedQueryParams.get(POST_PAGE_FILTER);
  const pageNumber = getPageNumberFromParam(pageNumberParam);
  const queryFilters = clientFilterOptions ? clientQueryFilters : filters;
  const shouldUseInitialQuestions = useMemo(
    () =>
      JSON.stringify(normalizePostsFeedFilters(queryFilters)) ===
      JSON.stringify(normalizePostsFeedFilters(filters)),
    [filters, queryFilters]
  );
  const [clientPageNumber, setClientPageNumber] = useState(pageNumber);
  const targetLoadedCount = clientPageNumber * POSTS_PER_PAGE;
  const weightByPostId = useMemo(() => {
    const map = new Map<number, number>();
    for (const [key, weight] of Object.entries(indexWeights)) {
      const id = Number(key);
      if (Number.isFinite(id)) map.set(id, weight);
    }
    return map;
  }, [indexWeights]);

  const { setBannerIsVisible } = useContentTranslatedBannerContext();
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();
  const {
    posts: paginatedPosts,
    loadedCount,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    totalCount,
  } = usePostsFeedQuery({
    filters: queryFilters,
    initialPosts:
      useInitialData && shouldUseInitialQuestions
        ? initialQuestions
        : undefined,
    initialCount:
      useInitialData && shouldUseInitialQuestions ? initialCount : undefined,
  });
  const visiblePosts = useMemo(
    () => paginatedPosts.slice(0, targetLoadedCount),
    [paginatedPosts, targetLoadedCount]
  );
  const hasCachedNextPage = paginatedPosts.length > visiblePosts.length;
  const shouldUseClientProjectTiles = !!clientFilterOptions;
  const shouldShowClientProjectTiles =
    shouldUseClientProjectTiles &&
    !isCommunity &&
    !PUBLIC_MINIMAL_UI &&
    shouldShowProjectTilesForParams(feedQueryParams);
  const { data: clientProjectTiles = EMPTY_PROJECT_TILES } =
    useFeedProjectTilesQuery({
      enabled: shouldShowClientProjectTiles,
      initialTiles:
        shouldShowClientProjectTiles && initialProjectTiles.length
          ? initialProjectTiles
          : undefined,
    });

  useEffect(() => {
    if (visiblePosts.some((q) => q.is_current_content_translated)) {
      setBannerIsVisible(true);
    }
  }, [visiblePosts, setBannerIsVisible]);

  useEffect(() => {
    setClientPageNumber(pageNumber);
  }, [pageNumber]);

  useEffect(() => {
    if (
      loadedCount >= targetLoadedCount ||
      !hasNextPage ||
      isFetchingNextPage
    ) {
      return;
    }

    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loadedCount,
    targetLoadedCount,
  ]);

  useEffect(() => {
    // capture search event from AwaitedPostsFeed
    sendAnalyticsEvent("feedSearch", {
      event_category: JSON.stringify(queryFilters),
    });
  }, [queryFilters]);

  useEffect(() => {
    if (error) {
      logError(error);
    }
  }, [error]);

  useEffect(() => {
    if (typeof totalCount === "number") {
      setResultCount({ count: totalCount });
      return;
    }

    setResultCount(
      visiblePosts.length
        ? {
            count: visiblePosts.length,
            isLowerBound: hasCachedNextPage || !!hasNextPage,
          }
        : undefined
    );
  }, [
    hasCachedNextPage,
    hasNextPage,
    setResultCount,
    totalCount,
    visiblePosts.length,
  ]);

  const loadMorePosts = async () => {
    if (hasCachedNextPage) {
      const nextPage = clientPageNumber + 1;
      const nextParams = new URLSearchParams(feedQueryParams);
      setSearchParamValue(nextParams, POST_PAGE_FILTER, String(nextPage));
      setPageParams(nextParams);
      setClientPageNumber(nextPage);
      return;
    }

    if (!hasNextPage || isFetchingNextPage) return;

    sendAnalyticsEvent("feedSearch", {
      event_category: JSON.stringify(queryFilters),
    });

    const result = await fetchNextPage();
    if (result.isError) {
      return;
    }

    const latestPage = result.data?.pages.at(-1);
    const newPostsCount = latestPage?.results.length ?? 0;

    if (newPostsCount) {
      const nextPage = Math.ceil(
        (visiblePosts.length + newPostsCount) / POSTS_PER_PAGE
      );
      const nextParams = new URLSearchParams(feedQueryParams);
      setSearchParamValue(nextParams, POST_PAGE_FILTER, String(nextPage));
      setPageParams(nextParams);
      setClientPageNumber(nextPage);
    }
  };

  const projectTiles = shouldUseClientProjectTiles
    ? shouldShowClientProjectTiles
      ? clientProjectTiles
      : EMPTY_PROJECT_TILES
    : initialProjectTiles;
  const feedItems = useMemo(
    () => buildFeedItems(visiblePosts, projectTiles),
    [visiblePosts, projectTiles]
  );

  const { layout: contextLayout } = useFeedLayout();
  const compactSearchMode = !!queryFilters.search;
  const layout = compactSearchMode ? "list" : forceLayout ?? contextLayout;
  const { columns: gridColumns, gap: gridGap } = useMediaValues(
    GRID_MEDIA,
    GRID_COLUMNS,
    GRID_GAPS
  );
  const isFeedLayoutReady = layout !== "grid" || mounted;
  const isConsumerView =
    !user || user.interface_type === InterfaceType.ConsumerView;

  return (
    <>
      <div className="flex flex-col gap-3">
        {queryFilters.statuses &&
          queryFilters.statuses === "pending" &&
          !isCommunity &&
          !PUBLIC_MINIMAL_UI && <InReviewBox />}
        {!isPending && !visiblePosts.length && (
          <>
            {isCommunity ? (
              <EmptyCommunityFeed statuses={queryFilters.statuses} />
            ) : (
              <span className="mt-3 text-center text-sm text-gray-900 dark:text-gray-900-dark">
                {t("noResults") + "."}
              </span>
            )}
          </>
        )}
        {isFeedLayoutReady ? (
          <>
            <FeedLayoutView
              columns={gridColumns}
              gap={gridGap}
              items={feedItems}
              feedPage={clientPageNumber}
              type={type}
              isCommunity={isCommunity}
              weightByPostId={weightByPostId}
              layout={layout}
              compactSearchMode={compactSearchMode}
              constrainConsumerList={isConsumerView && layout === "list"}
              useShortTitles={layout === "grid"}
            />
            <PostsFeedScrollRestoration
              serverPage={queryFilters.page ?? null}
              pageNumber={clientPageNumber}
              loadedCount={visiblePosts.length}
            />
          </>
        ) : (
          <LoadingSpinner className="mx-auto h-8 w-8 text-gray-600 dark:text-gray-600-dark" />
        )}
      </div>

      {!isFeedLayoutReady ? null : isPending && !visiblePosts.length ? (
        <LoadingSpinner className="mx-auto h-8 w-8 text-gray-600 dark:text-gray-600-dark" />
      ) : hasCachedNextPage || hasNextPage ? (
        <div className="flex py-5">
          {isFetchingNextPage && !hasCachedNextPage ? (
            <LoadingSpinner className="mx-auto h-8 w-8 text-gray-600 dark:text-gray-600-dark" />
          ) : (
            <div className="mx-auto flex flex-col items-center">
              <FormErrorMessage
                errors={(error as (Error & { digest?: string }) | null)?.digest}
              />
              <Button className="mx-auto" onClick={loadMorePosts}>
                {t("loadMoreButton")}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="m-8"></div>
      )}
    </>
  );
};

const FeedLayoutView: FC<{
  columns: number;
  gap: number;
  items: FeedItem[];
  feedPage: number;
  type: PostsFeedType;
  isCommunity?: boolean;
  weightByPostId: Map<number, number>;
  layout: FeedLayout;
  compactSearchMode?: boolean;
  constrainConsumerList?: boolean;
  useShortTitles?: boolean;
}> = ({
  columns,
  gap,
  items,
  feedPage,
  type,
  isCommunity,
  weightByPostId,
  layout,
  compactSearchMode,
  constrainConsumerList,
  useShortTitles,
}) => {
  const className = cn(constrainConsumerList && "mx-auto w-full max-w-3xl");

  const renderItem = (item: FeedItem) => (
    <FeedItemCard
      item={item}
      feedPage={feedPage}
      type={type}
      isCommunity={isCommunity}
      weightByPostId={weightByPostId}
      compactSearchMode={compactSearchMode}
      useShortTitle={useShortTitles}
    />
  );

  if (layout === "grid") {
    return (
      <VirtualizedMasonry
        className={className}
        columns={columns}
        estimateSize={estimateFeedItemSize}
        gap={gap}
        getItemKey={getFeedItemKey}
        items={items}
        overscan={GRID_OVERSCAN}
        render={renderItem}
      />
    );
  }

  return (
    <Masonry
      className={className}
      items={items}
      config={{
        columns: 1,
        gap: 12,
      }}
      render={renderItem}
    />
  );
};

const FeedItemCardComponent: FC<{
  item: FeedItem;
  feedPage: number;
  type: PostsFeedType;
  isCommunity?: boolean;
  weightByPostId: Map<number, number>;
  compactSearchMode?: boolean;
  useShortTitle?: boolean;
}> = ({
  item,
  feedPage,
  type,
  isCommunity,
  weightByPostId,
  compactSearchMode,
  useShortTitle,
}) => {
  if (item.type === "project") {
    return <FeedTournamentTile tile={item.tile} feedPage={feedPage} />;
  }

  const { post } = item;

  if (compactSearchMode) {
    return <CompactSearchPostCard post={post} />;
  }

  if (isNotebookPost(post) && type === "news") {
    return <NewsCard post={post} />;
  }

  const indexWeight = weightByPostId.get(post.id);

  return (
    <QuestionVariantComposer
      consumer={
        <ConsumerPostCard
          post={post}
          forCommunityFeed={isCommunity}
          indexWeight={indexWeight}
          forFeedPage
          useShortTitle={useShortTitle}
        />
      }
      forecaster={
        <PostCard
          post={post}
          forCommunityFeed={isCommunity}
          indexWeight={indexWeight}
          forFeedPage
          useShortTitle={useShortTitle}
        />
      }
    />
  );
};

const FeedItemCard = memo(FeedItemCardComponent);

export default PaginatedPostsFeed;
