"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getFilterSectionParticipation,
  getFilterSectionPostStatus,
  getFilterSectionPostType,
  getFilterSectionUsername,
} from "@/app/(main)/questions/helpers/filters";
import PostsFilters from "@/components/posts_filters";
import { GroupButton } from "@/components/ui/button_group";
import {
  POST_FOLLOWING_FILTER,
  POST_STATUS_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { PostStatus } from "@/types/post";
import { QuestionOrder } from "@/types/question";

type Props = {
  following?: boolean;
};

const MainFeedFilters: FC<Props> = ({ following }) => {
  const { params } = useSearchParams();
  const t = useTranslations();
  const { user } = useAuth();

  const filters = useMemo(() => {
    const filters = [
      getFilterSectionPostType({ t, params }),
      getFilterSectionPostStatus({
        statuses: [
          PostStatus.OPEN,
          PostStatus.CLOSED,
          PostStatus.PENDING_RESOLUTION,
          PostStatus.RESOLVED,
          PostStatus.UPCOMING,
          PostStatus.PENDING,
          PostStatus.DRAFT,
        ],
        t,
        params,
      }),
      getFilterSectionUsername({ t, params }),
    ];
    if (user) {
      filters.push(getFilterSectionParticipation({ t, params, user }));
    }
    return filters;
  }, [params, t, user]);

  const mainSortOptions: GroupButton<QuestionOrder>[] = useMemo(
    () => [
      {
        value: QuestionOrder.HotDesc,
        label: t("hot"),
      },
      {
        value: QuestionOrder.WeeklyMovementDesc,
        label: t("movers"),
      },
      {
        value: QuestionOrder.OpenTimeDesc,
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

  const onOrderChange = (
    order: QuestionOrder,
    setFilterParam: (
      name: string,
      val: string | string[],
      withNavigation?: boolean
    ) => void
  ) => {
    if (following) {
      setFilterParam(POST_FOLLOWING_FILTER, "true", false);
    }

    if (
      [
        QuestionOrder.ActivityDesc,
        QuestionOrder.WeeklyMovementDesc,
        QuestionOrder.PublishTimeDesc,
        QuestionOrder.CloseTimeAsc,
      ].includes(order)
    ) {
      setFilterParam(POST_STATUS_FILTER, "open", false);
    }
  };

  return (
    <PostsFilters
      filters={filters}
      mainSortOptions={mainSortOptions}
      sortOptions={sortOptions}
      onOrderChange={onOrderChange}
      defaultOrder={QuestionOrder.HotDesc}
      showRandomButton
    />
  );
};

export default MainFeedFilters;
