"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { useSearchParams } from "next/navigation";
import { FC, useEffect, useState } from "react";

import { fetchPosts } from "@/app/(main)/questions/actions";
import { generateFiltersFromSearchParams } from "@/app/(main)/questions/helpers/filters";
import PaginatedPostsFeed from "@/components/posts_feed/paginated_feed";
import { FormErrorMessage } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import { PostsParams } from "@/services/posts";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { logError } from "@/utils/errors";

type Props = {
  slug: string;
};

const TournamentFeed: FC<Props> = ({ slug }) => {
  const searchParams = useSearchParams();
  const questionFilters = generateFiltersFromSearchParams(
    Object.fromEntries(searchParams)
  );
  const pageFilters: PostsParams = {
    statuses: PostStatus.APPROVED,
    ...questionFilters,
    tournaments: slug,
  };

  const [questions, setQuestions] = useState<PostWithForecasts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(undefined);
      try {
        sendGAEvent("event", "feedSearch", {
          value: JSON.stringify(pageFilters),
        });
        const { questions } = (await fetchPosts(
          pageFilters,
          0,
          POSTS_PER_PAGE
        )) as { questions: PostWithForecasts[]; count: number };

        setQuestions(questions);
      } catch (e) {
        logError(e);
        const error = e as Error & { digest?: string };
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return isLoading ? (
    <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
  ) : error ? (
    <FormErrorMessage errors={error?.digest} />
  ) : (
    <PaginatedPostsFeed filters={pageFilters} initialQuestions={questions} />
  );
};

export default TournamentFeed;
