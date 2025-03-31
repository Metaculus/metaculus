"use client";
import { sendGAEvent } from "@next/third-parties/google";
import { isNil } from "lodash";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFeatureFlagVariantKey } from "posthog-js/react";
import { FC, Fragment, useEffect, useState } from "react";

import { fetchMorePosts } from "@/app/(main)/questions/actions";
import { useContentTranslatedBannerProvider } from "@/app/providers";
import ConsumerPostCard from "@/components/consumer_post_card";
import NewsCard from "@/components/news_card";
import PostCard from "@/components/post_card";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POSTS_PER_PAGE, POST_PAGE_FILTER } from "@/constants/posts_feed";
import { usePublicSettings } from "@/contexts/public_settings_context";
import useSearchParams from "@/hooks/use_search_params";
import { PostsParams } from "@/services/posts";
import { PostWithForecasts, NotebookPost } from "@/types/post";
import { logError } from "@/utils/errors";
import { isConditionalPost, isNotebookPost } from "@/utils/questions";

import { SCROLL_CACHE_KEY } from "./constants";
import EmptyCommunityFeed from "./empty_community_feed";
import PostsFeedScrollRestoration from "./feed_scroll_restoration";
import InReviewBox from "./in_review_box";
import { FormErrorMessage } from "../ui/form_field";

export type PostsFeedType = "posts" | "news";

type Props = {
  initialQuestions: PostWithForecasts[];
  filters: PostsParams;
  type?: PostsFeedType;
  isCommunity?: boolean;
};

const FEATURE_FLAG_KEY = "consumer-view-test";
const CONSUMER_VIEW_ENABLED_VARIANT = "consumer-view-enabled";

const PaginatedPostsFeed: FC<Props> = ({
  initialQuestions,
  filters,
  type = "posts",
  isCommunity,
}) => {
  const t = useTranslations();
  const pathname = usePathname();
  const { params, setParam, shallowNavigateToSearchParams } = useSearchParams();
  const consumerViewVariant = useFeatureFlagVariantKey(FEATURE_FLAG_KEY);
  const pageNumberParam = params.get(POST_PAGE_FILTER);
  const pageNumber = !isNil(pageNumberParam)
    ? Number(params.get(POST_PAGE_FILTER))
    : 1;
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

  const { setBannerIsVisible } = useContentTranslatedBannerProvider();
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();

  useEffect(() => {
    if (
      initialQuestions.filter((q) => q.is_current_content_translated).length > 0
    ) {
      setBannerIsVisible(true);
    }
  }, [initialQuestions, setBannerIsVisible]);

  useEffect(() => {
    // capture search event from AwaitedPostsFeed
    sendGAEvent("event", "feedSearch", {
      event_category: JSON.stringify(filters),
    });
  }, [filters]);
  const loadMorePosts = async () => {
    if (hasMoreData) {
      setIsLoading(true);
      setError(undefined);
      try {
        sendGAEvent("event", "feedSearch", {
          event_category: JSON.stringify(filters),
        });
        const { newPosts, hasNextPage } = await fetchMorePosts(
          filters,
          offset,
          POSTS_PER_PAGE
        );

        if (
          newPosts.filter((q) => q.is_current_content_translated).length > 0
        ) {
          setBannerIsVisible(true);
        }

        if (!hasNextPage) setHasMoreData(false);
        if (!!newPosts.length) {
          setPaginatedPosts((prevPosts) => [...prevPosts, ...newPosts]);
          setParam(POST_PAGE_FILTER, `${offset / POSTS_PER_PAGE + 1}`, false);
          setOffset((prevOffset) => prevOffset + POSTS_PER_PAGE);
          shallowNavigateToSearchParams();
        }
      } catch (err) {
        logError(err);
        const error = err as Error & { digest?: string };
        setError(error);
      } finally {
        const fullPathname = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
        const currentScroll = window.scrollY;
        if (currentScroll >= 0) {
          sessionStorage.setItem(
            SCROLL_CACHE_KEY,
            JSON.stringify({
              scrollPathName: fullPathname,
              scrollPosition: currentScroll.toString(),
            })
          );
        }
        setIsLoading(false);
      }
    }
  };

  const renderPost = (post: PostWithForecasts) => {
    if (type === "news" && post.notebook) {
      return <NewsCard post={post as NotebookPost} />;
    }

    if (
      consumerViewVariant === CONSUMER_VIEW_ENABLED_VARIANT &&
      !isNotebookPost(post) &&
      !isConditionalPost(post)
    ) {
      return <ConsumerPostCard post={post} />;
    }
    return <PostCard post={post} />;
  };

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
        {paginatedPosts.map((p) => (
          <Fragment key={p.id}>{renderPost(p)}</Fragment>
        ))}
        <PostsFeedScrollRestoration
          serverPage={filters.page ?? null}
          pageNumber={pageNumber}
          initialQuestions={initialQuestions}
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

export default PaginatedPostsFeed;
