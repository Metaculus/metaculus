"use client";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { fetchMorePosts } from "@/app/(main)/questions/actions";
import PostCard from "@/components/post_card";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import { PostsParams } from "@/services/posts";
import { PostWithForecasts } from "@/types/post";

type Props = {
  initialQuestions: PostWithForecasts[];
  totalCount: number;
  filters: PostsParams;
};

const PaginatedPostsFeed: FC<Props> = ({
  initialQuestions,
  totalCount,
  filters,
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

  return (
    <>
      <div className="flex flex-col gap-3">
        {!paginatedPosts.length && (
          <span className="mt-3 text-center text-sm text-gray-900 dark:text-gray-900-dark">
            {t("noResults") + "."}
          </span>
        )}
        {paginatedPosts.map((q) => (
          <PostCard key={q.id} post={q} />
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
      ) : null}
    </>
  );
};

export default PaginatedPostsFeed;
