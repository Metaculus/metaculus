"use client";
import { useTranslations } from "next-intl";
import { FC, Fragment, useState } from "react";

import { fetchMorePosts } from "@/app/(main)/questions/actions";
import NewsCard from "@/components/news_card";
import PostCard from "@/components/post_card";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import { PostsParams } from "@/services/posts";
import { PostWithForecasts, PostWithNotebook } from "@/types/post";

import InReviewBox from "./in_review_box";

export type PostsFeedType = "posts" | "news";

type Props = {
  initialQuestions: PostWithForecasts[];
  totalCount: number;
  filters: PostsParams;
  type?: PostsFeedType;
};

const PaginatedPostsFeed: FC<Props> = ({
  initialQuestions,
  totalCount,
  filters,
  type = "posts",
}) => {
  const t = useTranslations();

  const [paginatedPosts, setPaginatedPosts] =
    useState<PostWithForecasts[]>(initialQuestions);
  const [offset, setOffset] = useState(POSTS_PER_PAGE);
  const [hasMoreData, setHasMoreData] = useState(
    initialQuestions.length < totalCount
  );
  const [isLoading, setIsLoading] = useState(false);

  // TODO: handle error case
  const loadMorePosts = async () => {
    if (hasMoreData) {
      setIsLoading(true);
      const newPosts = await fetchMorePosts(filters, offset, POSTS_PER_PAGE);

      if (newPosts.length < POSTS_PER_PAGE) {
        setHasMoreData(false);
      }

      setPaginatedPosts((prevPosts) => [...prevPosts, ...newPosts]);
      setOffset((prevOffset) => prevOffset + POSTS_PER_PAGE);
      setIsLoading(false);
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
        {filters.statuses && filters.statuses === "pending" && <InReviewBox />}
        {!paginatedPosts.length && (
          <span className="mt-3 text-center text-sm text-gray-900 dark:text-gray-900-dark">
            {t("noResults") + "."}
          </span>
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
            <Button className="mx-auto" onClick={loadMorePosts}>
              Load more
            </Button>
          )}
        </div>
      ) : (
        <div className="m-8"></div>
      )}
    </>
  );
};

export default PaginatedPostsFeed;
