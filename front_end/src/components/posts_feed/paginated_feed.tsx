"use client";
import { sendGAEvent } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, Fragment, useEffect, useState } from "react";

import { fetchMorePosts } from "@/app/(main)/questions/actions";
import { useContentTranslatedBannerProvider } from "@/app/providers";
import NewsCard from "@/components/news_card";
import PostCard from "@/components/post_card";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POSTS_PER_PAGE, POST_PAGE_FILTER } from "@/constants/posts_feed";
import useSearchParams from "@/hooks/use_search_params";
import { PostsParams } from "@/services/posts";
import { PostWithForecasts, PostWithNotebook } from "@/types/post";
import { logError } from "@/utils/errors";

import EmptyCommunityFeed from "./empty_community_feed";
import InReviewBox from "./in_review_box";
import { FormErrorMessage } from "../ui/form_field";

export type PostsFeedType = "posts" | "news";

type Props = {
  initialQuestions: PostWithForecasts[];
  filters: PostsParams;
  type?: PostsFeedType;
  isCommunity?: boolean;
};

const PaginatedPostsFeed: FC<Props> = ({
  initialQuestions,
  filters,
  type = "posts",
  isCommunity,
}) => {
  const t = useTranslations();
  const { params, setParam, shallowNavigateToSearchParams } = useSearchParams();
  const pathname = usePathname();
  const fullPathname = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  const pageNumber = Number(params.get(POST_PAGE_FILTER));
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

  const { setBannerisVisible } = useContentTranslatedBannerProvider();

  useEffect(() => {
    if (
      initialQuestions.filter((q) => q.is_current_content_translated).length > 0
    ) {
      setBannerisVisible(true);
    }
  }, [initialQuestions, setBannerisVisible]);

  useEffect(() => {
    const cacheKey = `scroll-${fullPathname}`;
    let timeoutId = undefined;
    const saveScrollPosition = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 0) {
        sessionStorage.setItem(cacheKey, currentScroll.toString());
      }
    };

    const savedScrollPosition = sessionStorage.getItem(cacheKey);

    if (savedScrollPosition && initialQuestions.length > 0 && !!pageNumber) {
      timeoutId = setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScrollPosition),
          behavior: "smooth",
        });

        sessionStorage.removeItem(cacheKey);
        window.addEventListener("scrollend", saveScrollPosition);
      }, 1000);
    } else {
      window.addEventListener("scrollend", saveScrollPosition);
    }

    return () => {
      window.removeEventListener("scrollend", saveScrollPosition);
      timeoutId && clearTimeout(timeoutId);
    };
  }, [initialQuestions, fullPathname, pathname]);

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
          setBannerisVisible(true);
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
        setIsLoading(false);
      }
    }
  };

  const renderPost = (post: PostWithForecasts) => {
    if (type === "news" && post.notebook) {
      return <NewsCard post={post as PostWithNotebook} />;
    }

    return <PostCard post={post} />;
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {filters.statuses && filters.statuses === "pending" && !isCommunity && (
          <InReviewBox />
        )}
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
