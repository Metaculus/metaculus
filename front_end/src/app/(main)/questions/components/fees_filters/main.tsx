"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getFilterSectionPostStatus,
  getFilterSectionPostType,
  getFilterSectionUsername,
} from "@/app/(main)/questions/helpers/filters";
import PostsFilters from "@/components/posts_filters";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { QuestionOrder } from "@/types/question";

const MainFeedFilters: FC = () => {
  const { user } = useAuth();
  const { params } = useSearchParams();
  const t = useTranslations();

  const filters = useMemo(() => {
    return [
      getFilterSectionPostType({ t, params }),
      getFilterSectionPostStatus({ t, params }),
      getFilterSectionUsername({ t, params }),
    ];
  }, [params, t]);

  const mainSortOptions = useMemo(
    () => [
      {
        id: QuestionOrder.ActivityDesc,
        label: t("hot"),
      },
      {
        id: QuestionOrder.WeeklyMovementDesc,
        label: t("movers"),
      },
      {
        id: QuestionOrder.PublishTimeDesc,
        label: t("new"),
      },
    ],
    [t]
  );

  const sortOptions = useMemo(
    () => [
      { value: QuestionOrder.VotesDesc, label: t("mostUpvotes") },
      { value: QuestionOrder.CommentCountDesc, label: t("mostComments") },
      {
        value: QuestionOrder.PredictionCountDesc,
        label: t("mostPredictions"),
      },
      { value: QuestionOrder.CloseTimeAsc, label: t("closingSoon") },
      { value: QuestionOrder.ResolveTimeAsc, label: t("resolvingSoon") },
    ],
    [t]
  );

  return (
    <PostsFilters
      filters={filters}
      mainSortOptions={mainSortOptions}
      sortOptions={sortOptions}
    />
  );
};

export default MainFeedFilters;
