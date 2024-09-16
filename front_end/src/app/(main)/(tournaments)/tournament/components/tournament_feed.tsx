"use client";

import { useSearchParams } from "next/navigation";
import { FC, useEffect, useState } from "react";

import { fetchPosts } from "@/app/(main)/questions/actions";
import { generateFiltersFromSearchParams } from "@/app/(main)/questions/helpers/filters";
import PaginatedPostsFeed from "@/components/posts_feed/paginated_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import { PostsParams } from "@/services/posts";
import { PostWithForecasts } from "@/types/post";

type Props = {
  slug: string;
};

const TournamentFeed: FC<Props> = ({ slug }) => {
  const searchParams = useSearchParams();
  const questionFilters = generateFiltersFromSearchParams(
    Object.fromEntries(searchParams)
  );
  const pageFilters: PostsParams = {
    ...questionFilters,
    tournaments: slug,
  };
  const [questions, setQuestions] = useState<PostWithForecasts[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { questions, count } = (await fetchPosts(
        pageFilters,
        0,
        POSTS_PER_PAGE
      )) as { questions: PostWithForecasts[]; count: number };

      setQuestions(questions);
      setCount(count);
      setIsLoading(false);
    };
    fetchData();
  }, [searchParams]);

  return isLoading ? (
    <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
  ) : (
    <PaginatedPostsFeed
      filters={pageFilters}
      initialQuestions={questions}
      totalCount={count}
    />
  );
};

export default TournamentFeed;
