"use client";

import { FC, useEffect, useMemo } from "react";

import { generateFiltersFromSearchParams } from "@/app/(main)/questions/helpers/filters";
import { useFeedQuery } from "@/app/(main)/questions/hooks/use_feed_query";
import PaginatedPostsFeed from "@/components/posts_feed/paginated_feed";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import { PostsParams } from "@/services/api/posts/posts.shared";
import { PostStatus } from "@/types/post";
import { Tournament } from "@/types/projects";
import { QuestionOrder } from "@/types/question";
import { urlSearchParamsToRecord } from "@/utils/navigation";

type Props = {
  tournament: Tournament | null;
};

const TournamentFeed: FC<Props> = ({ tournament }) => {
  const { params } = useFeedQuery();
  const pageFilters: PostsParams = useMemo(() => {
    const questionFilters = generateFiltersFromSearchParams(
      urlSearchParamsToRecord(params),
      {
        withoutPageParam: true,
        defaultOrderBy: QuestionOrder.HotDesc,
      }
    );

    return {
      statuses: PostStatus.APPROVED,
      ...questionFilters,
      tournaments: tournament?.id.toString(),
    };
  }, [params, tournament]);
  const { setBannerIsVisible } = useContentTranslatedBannerContext();

  useEffect(() => {
    if (tournament?.is_current_content_translated) {
      setBannerIsVisible(true);
    }
  }, [setBannerIsVisible, tournament]);

  const weights = tournament?.index_data?.weights ?? {};

  return (
    <PaginatedPostsFeed
      indexWeights={weights}
      filters={pageFilters}
      initialQuestions={[]}
      forceLayout="list"
      useInitialData={false}
    />
  );
};

export default TournamentFeed;
