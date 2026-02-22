"use client";

import { useSearchParams } from "next/navigation";
import { FC, useEffect, useState } from "react";

import { generateFiltersFromSearchParams } from "@/app/(main)/questions/helpers/filters";
import PaginatedPostsFeed from "@/components/posts_feed/paginated_feed";
import { FormErrorMessage } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostsParams } from "@/services/api/posts/posts.shared";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { Tournament } from "@/types/projects";
import { QuestionOrder } from "@/types/question";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { logError } from "@/utils/core/errors";
import { urlSearchParamsToRecord } from "@/utils/navigation";

type Props = {
  tournament: Tournament | null;
};

const TournamentFeed: FC<Props> = ({ tournament }) => {
  const searchParams = useSearchParams();
  const questionFilters = generateFiltersFromSearchParams(
    urlSearchParamsToRecord(searchParams),
    {
      withoutPageParam: true,
      defaultOrderBy: QuestionOrder.HotDesc,
    }
  );
  const pageFilters: PostsParams = {
    statuses: PostStatus.APPROVED,
    ...questionFilters,
    tournaments: tournament?.id.toString(),
  };

  const [questions, setQuestions] = useState<PostWithForecasts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();
  const { setBannerIsVisible } = useContentTranslatedBannerContext();

  useEffect(() => {
    if (
      tournament?.is_current_content_translated ||
      questions.filter((q) => q.is_current_content_translated).length > 0
    ) {
      setBannerIsVisible(true);
    }
  }, [questions, setBannerIsVisible, tournament]);
  const relevantParams = urlSearchParamsToRecord(searchParams);
  const { page, ...otherParams } = relevantParams;
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(undefined);
      try {
        sendAnalyticsEvent("feedSearch", {
          event_category: JSON.stringify(pageFilters),
        });
        const { results: questions } = await ClientPostsApi.getPostsWithCP({
          ...pageFilters,
          offset: 0,
          limit: (!isNaN(Number(page)) ? Number(page) : 1) * POSTS_PER_PAGE,
        });

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
  }, [JSON.stringify(otherParams)]);

  const weights = tournament?.index_data?.weights ?? {};

  return isLoading ? (
    <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
  ) : error ? (
    <FormErrorMessage errors={error?.digest} />
  ) : (
    <PaginatedPostsFeed
      indexWeights={weights}
      filters={pageFilters}
      initialQuestions={questions}
    />
  );
};

export default TournamentFeed;
