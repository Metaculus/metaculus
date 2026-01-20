"use client";

import { isNil } from "lodash";
import { FC, useEffect, useState } from "react";

import PostsFeedScrollRestoration from "@/components/posts_feed/feed_scroll_restoration";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POSTS_PER_PAGE, POST_PAGE_FILTER } from "@/constants/posts_feed";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import useSearchParams from "@/hooks/use_search_params";
import ClientPostsApi from "@/services/api/posts/posts.client";
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

/**
 * FutureEval News Feed
 *
 * A paginated news feed using FutureEval-themed news cards.
 * Based on PaginatedPostsFeed but simplified for news-only display.
 */
const FutureEvalNewsFeed: FC<Props> = ({ initialQuestions, filters }) => {
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

  const [hasMoreData, setHasMoreData] = useState(
    initialQuestions.length >= POSTS_PER_PAGE
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();

  const { setBannerIsVisible } = useContentTranslatedBannerContext();

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

  return (
    <>
      <div className="flex flex-col gap-4">
        {!paginatedPosts.length && (
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
        {paginatedPosts.map(
          (p) =>
            isNotebookPost(p) && (
              <FutureEvalNewsCard key={p.id} post={p as NotebookPost} />
            )
        )}
        <PostsFeedScrollRestoration
          serverPage={filters.page ?? null}
          pageNumber={clientPageNumber}
          loadedCount={paginatedPosts.length}
        />
      </div>

      {hasMoreData ? (
        <div className="flex py-5">
          {isLoading ? (
            <LoadingIndicator className="mx-auto h-8 w-24 text-futureeval-primary-light dark:text-futureeval-primary-dark" />
          ) : (
            <div className="mx-auto flex flex-col items-center">
              <FormErrorMessage errors={error?.digest} />
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
