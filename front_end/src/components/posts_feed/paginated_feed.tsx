"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import { QuestionVariantComposer } from "@/app/(main)/questions/[id]/components/question_variant_composer";
import ConsumerPostCard from "@/components/consumer_post_card";
import NewsCard from "@/components/news_card";
import PostCard from "@/components/post_card";
import Button from "@/components/ui/button";
import { type FeedLayout } from "@/components/ui/layout_switcher";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { Masonry } from "@/components/ui/masonry";
import { POST_PAGE_FILTER, POSTS_PER_PAGE } from "@/constants/posts_feed";
import { useFeedLayout } from "@/contexts/feed_layout_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import useSearchParams from "@/hooks/use_search_params";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostsParams } from "@/services/api/posts/posts.shared";
import { PostWithForecasts } from "@/types/post";
import { FeedProjectTile } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { logError } from "@/utils/core/errors";
import { isNotebookPost } from "@/utils/questions/helpers";

import { FeedItem, buildFeedItems } from "./build_feed_items";
import EmptyCommunityFeed from "./empty_community_feed";
import PostsFeedScrollRestoration from "./feed_scroll_restoration";
import FeedTournamentTile from "./feed_tournament_tile";
import InReviewBox from "./in_review_box";
import { FormErrorMessage } from "../ui/form_field";

export type PostsFeedType = "posts" | "news";

type Props = {
  initialQuestions: PostWithForecasts[];
  initialProjectTiles?: FeedProjectTile[];
  filters: PostsParams;
  type?: PostsFeedType;
  isCommunity?: boolean;
  indexWeights?: Record<string, number>;
  forceLayout?: FeedLayout;
};

const PaginatedPostsFeed: FC<Props> = ({
  initialQuestions,
  initialProjectTiles = [],
  filters,
  type = "posts",
  isCommunity,
  indexWeights = {},
  forceLayout,
}) => {
  const t = useTranslations();
  const { params, setParam, replaceUrlWithoutNavigation } = useSearchParams();
  const pageNumberParam = params.get(POST_PAGE_FILTER);
  const pageNumber = !isNil(pageNumberParam)
    ? Number(params.get(POST_PAGE_FILTER))
    : 1;
  const [clientPageNumber, setClientPageNumber] = useState(pageNumber);
  const [paginatedPosts, setPaginatedPosts] =
    useState<PostWithForecasts[]>(initialQuestions);
  const [offset, setOffset] = useState(
    !isNaN(pageNumber) && pageNumber > 0
      ? pageNumber * POSTS_PER_PAGE
      : POSTS_PER_PAGE
  );
  const weightByPostId = useMemo(() => {
    const map = new Map<number, number>();
    for (const [key, weight] of Object.entries(indexWeights)) {
      const id = Number(key);
      if (Number.isFinite(id)) map.set(id, weight);
    }
    return map;
  }, [indexWeights]);

  const [hasMoreData, setHasMoreData] = useState(
    initialQuestions.length >= POSTS_PER_PAGE
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();

  const { setBannerIsVisible } = useContentTranslatedBannerContext();
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();

  useEffect(() => {
    if (
      initialQuestions.filter((q) => q.is_current_content_translated).length > 0
    ) {
      setBannerIsVisible(true);
    }
  }, [initialQuestions, setBannerIsVisible]);
  useEffect(() => {
    setClientPageNumber(pageNumber);
  }, [pageNumber]);

  useEffect(() => {
    // capture search event from AwaitedPostsFeed
    sendAnalyticsEvent("feedSearch", {
      event_category: JSON.stringify(filters),
    });
  }, [filters]);
  const loadMorePosts = async () => {
    if (!hasMoreData) return;

    setIsLoading(true);
    setError(undefined);
    try {
      sendAnalyticsEvent("feedSearch", {
        event_category: JSON.stringify(filters),
      });
      const response = await ClientPostsApi.getPostsWithCP({
        ...filters,
        offset,
        limit: POSTS_PER_PAGE,
      });
      const newPosts = response.results;
      const hasNextPage = !!response.next && newPosts.length >= POSTS_PER_PAGE;

      if (newPosts.some((q) => q.is_current_content_translated)) {
        setBannerIsVisible(true);
      }

      if (!hasNextPage) setHasMoreData(false);
      if (newPosts.length) {
        setPaginatedPosts((prev) => [...prev, ...newPosts]);
        const nextPage = offset / POSTS_PER_PAGE + 1;
        setParam(POST_PAGE_FILTER, String(nextPage), false);
        replaceUrlWithoutNavigation();
        setClientPageNumber(nextPage);
        setOffset((prevOffset) => prevOffset + POSTS_PER_PAGE);
      }
    } catch (err) {
      logError(err);
      setError(err as Error & { digest?: string });
    } finally {
      setIsLoading(false);
    }
  };

  const feedItems = useMemo(
    () => buildFeedItems(paginatedPosts, initialProjectTiles),
    [paginatedPosts, initialProjectTiles]
  );

  const { layout: contextLayout } = useFeedLayout();
  const layout = forceLayout ?? contextLayout;

  return (
    <>
      <div className="flex flex-col gap-3">
        {filters.statuses &&
          filters.statuses === "pending" &&
          !isCommunity &&
          !PUBLIC_MINIMAL_UI && <InReviewBox />}
        {!paginatedPosts.length && (
          <>
            {isCommunity ? (
              <EmptyCommunityFeed statuses={filters.statuses} />
            ) : (
              <span className="mt-3 text-center text-sm text-gray-900 dark:text-gray-900-dark">
                {t("noResults") + "."}
              </span>
            )}
          </>
        )}
        <FeedLayoutView
          items={feedItems}
          feedPage={clientPageNumber}
          type={type}
          isCommunity={isCommunity}
          weightByPostId={weightByPostId}
          layout={layout}
        />
        <PostsFeedScrollRestoration
          serverPage={filters.page ?? null}
          pageNumber={clientPageNumber}
          loadedCount={paginatedPosts.length}
        />
      </div>

      {hasMoreData ? (
        <div className="flex py-5">
          {isLoading ? (
            <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
          ) : (
            <div className="mx-auto flex flex-col items-center">
              <FormErrorMessage errors={error?.digest} />
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
  items: FeedItem[];
  feedPage: number;
  type: PostsFeedType;
  isCommunity?: boolean;
  weightByPostId: Map<number, number>;
  layout: FeedLayout;
}> = ({ items, feedPage, type, isCommunity, weightByPostId, layout }) => {
  return (
    <Masonry
      items={items}
      config={{
        columns: layout === "grid" ? [1, 2, 3] : 1,
        gap: layout === "grid" ? [12, 12, 12] : 12,
        media: layout === "grid" ? [1024, 1280, 1536] : undefined,
        useBalancedLayout: layout === "grid",
      }}
      render={(item) => (
        <FeedItemCard
          key={
            item.type === "project"
              ? `project-${item.tile.project_id}`
              : `post-${item.post.id}`
          }
          item={item}
          feedPage={feedPage}
          type={type}
          isCommunity={isCommunity}
          weightByPostId={weightByPostId}
          forceConsumer={layout === "grid"}
        />
      )}
    />
  );
};

const FeedItemCard: FC<{
  item: FeedItem;
  feedPage: number;
  type: PostsFeedType;
  isCommunity?: boolean;
  weightByPostId: Map<number, number>;
  forceConsumer?: boolean;
}> = ({ item, feedPage, type, isCommunity, weightByPostId, forceConsumer }) => {
  if (item.type === "project") {
    return <FeedTournamentTile tile={item.tile} feedPage={feedPage} />;
  }

  const { post } = item;

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
        />
      }
      forecaster={
        forceConsumer ? (
          <ConsumerPostCard
            post={post}
            forCommunityFeed={isCommunity}
            indexWeight={indexWeight}
          />
        ) : (
          <PostCard
            post={post}
            forCommunityFeed={isCommunity}
            indexWeight={indexWeight}
          />
        )
      }
    />
  );
};

export default PaginatedPostsFeed;
