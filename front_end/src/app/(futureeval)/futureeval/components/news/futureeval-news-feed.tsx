"use client";

import { FC, useEffect, useMemo, useState } from "react";

import {
  FEED_PAGE_QUERY_OPTIONS,
  setSearchParamValue,
  useFeedQueryParams,
} from "@/app/(main)/questions/hooks/use_feed_query_params";
import PostsFeedScrollRestoration from "@/components/posts_feed/feed_scroll_restoration";
import { usePostsFeedQuery } from "@/components/posts_feed/hooks/use_posts_feed_query";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POSTS_PER_PAGE, POST_PAGE_FILTER } from "@/constants/posts_feed";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import { PostsParams } from "@/services/api/posts/posts.shared";
import { NotebookPost, PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";
import { isNotebookPost } from "@/utils/questions/helpers";

import FutureEvalNewsCard from "./futureeval-news-card";
import { FE_COLORS, FE_TYPOGRAPHY } from "../../theme";

type Props = {
  initialQuestions: PostWithForecasts[];
  filters: PostsParams;
};

function getPageNumberFromParam(pageNumberParam: string | null) {
  const pageNumber = Number(pageNumberParam);

  return Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
}

/**
 * FutureEval News Feed
 *
 * A paginated news feed using FutureEval-themed news cards.
 * Based on PaginatedPostsFeed but simplified for news-only display.
 */
const FutureEvalNewsFeed: FC<Props> = ({ initialQuestions, filters }) => {
  const { params, setParams } = useFeedQueryParams();
  const pageNumberParam = params.get(POST_PAGE_FILTER);
  const pageNumber = getPageNumberFromParam(pageNumberParam);
  const [clientPageNumber, setClientPageNumber] = useState(pageNumber);
  const targetLoadedCount = clientPageNumber * POSTS_PER_PAGE;

  const { setBannerIsVisible } = useContentTranslatedBannerContext();
  const {
    posts: paginatedPosts,
    loadedCount,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = usePostsFeedQuery({
    filters,
    initialPosts: initialQuestions,
  });
  const visiblePosts = useMemo(
    () => paginatedPosts.slice(0, targetLoadedCount),
    [paginatedPosts, targetLoadedCount]
  );
  const hasCachedNextPage = paginatedPosts.length > visiblePosts.length;

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
    sendAnalyticsEvent("feedSearch", {
      event_category: JSON.stringify(filters),
    });
  }, [filters]);

  useEffect(() => {
    if (error) {
      logError(error);
    }
  }, [error]);

  const loadMorePosts = async () => {
    if (hasCachedNextPage) {
      const nextPage = clientPageNumber + 1;
      const nextParams = new URLSearchParams(params);
      setSearchParamValue(nextParams, POST_PAGE_FILTER, String(nextPage));
      void setParams(nextParams, FEED_PAGE_QUERY_OPTIONS);
      setClientPageNumber(nextPage);
      return;
    }

    if (!hasNextPage || isFetchingNextPage) return;

    sendAnalyticsEvent("feedSearch", {
      event_category: JSON.stringify(filters),
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
      const nextParams = new URLSearchParams(params);
      setSearchParamValue(nextParams, POST_PAGE_FILTER, String(nextPage));
      void setParams(nextParams, FEED_PAGE_QUERY_OPTIONS);
      setClientPageNumber(nextPage);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {!visiblePosts.length && (
          <span
            className={cn(
              "mt-3 text-center",
              FE_TYPOGRAPHY.body,
              FE_COLORS.textMuted
            )}
          >
            No results found.
          </span>
        )}
        {visiblePosts.map(
          (p) =>
            isNotebookPost(p) && (
              <FutureEvalNewsCard key={p.id} post={p as NotebookPost} />
            )
        )}
        <PostsFeedScrollRestoration
          serverPage={filters.page ?? null}
          pageNumber={clientPageNumber}
          loadedCount={visiblePosts.length}
        />
      </div>

      {hasCachedNextPage || hasNextPage ? (
        <div className="flex py-5">
          {isFetchingNextPage && !hasCachedNextPage ? (
            <LoadingIndicator className="mx-auto h-8 w-24 text-futureeval-primary-light dark:text-futureeval-primary-dark" />
          ) : (
            <div className="mx-auto flex flex-col items-center">
              <FormErrorMessage
                errors={
                  error
                    ? error.message || "An unexpected error occurred"
                    : undefined
                }
              />
              <Button
                className={cn(
                  "mx-auto",
                  // FutureEval themed button
                  "border-futureeval-primary-light bg-transparent text-futureeval-primary-light",
                  "hover:bg-futureeval-primary-light/10",
                  "dark:border-futureeval-primary-dark dark:text-futureeval-primary-dark",
                  "dark:hover:bg-futureeval-primary-dark/10"
                )}
                onClick={loadMorePosts}
              >
                Load More
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

export default FutureEvalNewsFeed;
