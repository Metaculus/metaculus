"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getFilterSectionPostType,
  POST_STATUS_LABEL_MAP,
} from "@/app/(main)/questions/helpers/filters";
import { FilterOptionType } from "@/components/popover_filter/types";
import PostsFilters from "@/components/posts_filters";
import { GroupButton } from "@/components/ui/button_group";
import { POST_STATUS_FILTER } from "@/constants/posts_feed";
import useSearchParams from "@/hooks/use_search_params";
import { PostStatus } from "@/types/post";
import { QuestionOrder } from "@/types/question";

const MyPredictionsFilters: FC = () => {
  const { params } = useSearchParams();
  const t = useTranslations();

  const filters = useMemo(() => {
    return [
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
  }, [params, t]);

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
        value: QuestionOrder.StaleDesc,
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

  const onOrderChange = (
    order: QuestionOrder,
    setFilterParam: (
      name: string,
      val: string | string[],
      withNavigation?: boolean
    ) => void
  ) => {
    if (
      [
        QuestionOrder.WeeklyMovementDesc,
        QuestionOrder.DivergenceDesc,
        QuestionOrder.StaleDesc,
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
      onOrderChange={onOrderChange}
      defaultOrder={QuestionOrder.WeeklyMovementDesc}
    />
  );
};

export default MyPredictionsFilters;
