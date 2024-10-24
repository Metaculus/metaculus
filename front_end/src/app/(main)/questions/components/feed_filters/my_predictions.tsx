"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getFilterSectionParticipation,
  getFilterSectionPostType,
  POST_STATUS_LABEL_MAP,
} from "@/app/(main)/questions/helpers/filters";
import {
  FilterOptionType,
  FilterReplaceInfo,
} from "@/components/popover_filter/types";
import PostsFilters from "@/components/posts_filters";
import { GroupButton } from "@/components/ui/button_group";
import {
  POST_FORECASTER_ID_FILTER,
  POST_ORDER_BY_FILTER,
  POST_STATUS_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { PostStatus } from "@/types/post";
import { QuestionOrder } from "@/types/question";

const MyPredictionsFilters: FC = () => {
  const { params } = useSearchParams();
  const t = useTranslations();
  const { user } = useAuth();

  const filters = useMemo(() => {
    const filters = [
      getFilterSectionPostType({ t, params }),
      {
        id: POST_STATUS_FILTER,
        title: t("questionStatus"),
        type: FilterOptionType.MultiChip,
        options: [PostStatus.OPEN, PostStatus.CLOSED, PostStatus.RESOLVED].map(
          (status) => ({
            label: POST_STATUS_LABEL_MAP[status],
            value: status,
            active: params.getAll(POST_STATUS_FILTER).includes(status),
          })
        ),
      },
    ];
    if (user) {
      filters.push(getFilterSectionParticipation({ t, params, user }));
    }
    return filters;
  }, [params, t, user]);

  const mainSortOptions: GroupButton<QuestionOrder>[] = useMemo(
    () => [
      {
        value: QuestionOrder.WeeklyMovementDesc,
        label: t("movers"),
      },
      {
        value: QuestionOrder.DivergenceDesc,
        label: t("divergence"),
      },
      {
        value: QuestionOrder.LastPredictionTimeAsc,
        label: t("stale"),
      },
      {
        value: QuestionOrder.UnreadCommentCountDesc,
        label: t("newComments"),
      },
    ],
    [t]
  );

  const sortOptions = useMemo(
    () => [
      {
        value: QuestionOrder.LastPredictionTimeDesc,
        label: t("recentPredictions"),
      },
      { value: QuestionOrder.CloseTimeAsc, label: t("closingSoon") },
      { value: QuestionOrder.ScoreDesc, label: t("bestScores") },
      { value: QuestionOrder.ScoreAsc, label: t("worstScores") },
    ],
    [t]
  );

  const handleFilterChange = (
    change: {
      filterId: string;
      optionValue: string | string[] | null;
      replaceInfo?: FilterReplaceInfo;
    },
    deleteParam: (
      name: string,
      withNavigation?: boolean,
      value?: string
    ) => void
  ) => {
    if (!change.replaceInfo) return;

    const { optionId, replaceIds } = change.replaceInfo;
    const didRemoveUserFilter =
      optionId !== POST_FORECASTER_ID_FILTER &&
      replaceIds.includes(POST_FORECASTER_ID_FILTER);
    const isUserSpecificOrder = [
      QuestionOrder.WeeklyMovementDesc,
      QuestionOrder.DivergenceDesc,
      QuestionOrder.ScoreDesc,
      QuestionOrder.ScoreDesc,
      QuestionOrder.LastPredictionTimeDesc,
      QuestionOrder.HotAsc,
    ].includes(params.get(POST_ORDER_BY_FILTER) as QuestionOrder);

    if (didRemoveUserFilter && isUserSpecificOrder) {
      // clear user specific order if user filter is removed
      deleteParam(POST_ORDER_BY_FILTER, false);
    }
  };

  const handleOrderChange = (
    order: QuestionOrder,
    setFilterParam: (
      name: string,
      val: string | string[],
      withNavigation?: boolean
    ) => void
  ) => {
    if (user?.id) {
      setFilterParam(POST_FORECASTER_ID_FILTER, user.id.toString(), false);
    }

    if (
      [
        QuestionOrder.WeeklyMovementDesc,
        QuestionOrder.DivergenceDesc,
        QuestionOrder.HotAsc,
        QuestionOrder.UnreadCommentCountDesc,
        QuestionOrder.CloseTimeAsc,
      ].includes(order)
    ) {
      setFilterParam(POST_STATUS_FILTER, "open", false);
    }

    if ([QuestionOrder.ScoreDesc, QuestionOrder.ScoreAsc].includes(order)) {
      setFilterParam(POST_STATUS_FILTER, "resolved", false);
    }
  };

  return (
    <PostsFilters
      filters={filters}
      mainSortOptions={mainSortOptions}
      sortOptions={sortOptions}
      onOrderChange={handleOrderChange}
      onPopOverFilterChange={handleFilterChange}
      defaultOrder={QuestionOrder.WeeklyMovementDesc}
    />
  );
};

export default MyPredictionsFilters;
