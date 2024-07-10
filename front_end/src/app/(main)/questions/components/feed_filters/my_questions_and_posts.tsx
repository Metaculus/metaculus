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
import { POST_ACCESS_FILTER, POST_STATUS_FILTER } from "@/constants/posts_feed";
import useSearchParams from "@/hooks/use_search_params";
import { PostStatus } from "@/types/post";
import { QuestionOrder } from "@/types/question";

const MyQuestionsAndPostsFilters: FC = () => {
  const { params } = useSearchParams();
  const t = useTranslations();

  const filters = useMemo(() => {
    return [
      getFilterSectionPostType({ t, params }),
      {
        id: POST_STATUS_FILTER,
        title: t("questionStatus"),
        type: FilterOptionType.MultiChip,
        options: [
          PostStatus.DRAFT,
          PostStatus.PENDING,
          PostStatus.UPCOMING,
          PostStatus.APPROVED,
          PostStatus.CLOSED,
          PostStatus.RESOLVED,
          PostStatus.DELETED,
        ].map((status) => ({
          label: POST_STATUS_LABEL_MAP[status],
          value: status,
          active: params.getAll(POST_STATUS_FILTER).includes(status),
        })),
      },
      {
        id: POST_ACCESS_FILTER,
        title: t("special"),
        type: FilterOptionType.ToggleChip,
        options: [
          {
            id: POST_ACCESS_FILTER,
            label: t("personal"),
            value: "private",
            active: params.get(POST_ACCESS_FILTER) === "private",
          },
        ],
      },
    ];
  }, [params, t]);

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
        value: QuestionOrder.PredictionCountDesc,
        label: t("mostPredictions"),
      },
    ],
    [t]
  );

  const sortOptions = useMemo(
    () => [
      {
        value: QuestionOrder.UnreadCommentCountDesc,
        label: t("unreadComments"),
      },
      { value: QuestionOrder.CommentCountDesc, label: t("totalComments") },
      { value: QuestionOrder.VotesDesc, label: t("mostUpvotes") },
      {
        value: QuestionOrder.PublishTimeDesc,
        label: t("newest"),
      },
    ],
    [t]
  );

  return (
    <PostsFilters
      filters={filters}
      mainSortOptions={mainSortOptions}
      sortOptions={sortOptions}
      defaultOrder={QuestionOrder.ActivityDesc}
    />
  );
};

export default MyQuestionsAndPostsFilters;
