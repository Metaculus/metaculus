"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getFilterSectionParticipation,
  getFilterSectionPostStatus,
  getFilterSectionPostType,
} from "@/app/(main)/questions/helpers/filters";
import { FilterOptionType } from "@/components/popover_filter/types";
import PostsFilters from "@/components/posts_filters";
import { GroupButton } from "@/components/ui/button_group";
import { POST_ACCESS_FILTER } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { PostStatus } from "@/types/post";
import { QuestionOrder } from "@/types/question";

type Props = { panelClassname?: string };

const MyQuestionsAndPostsFilters: FC<Props> = ({ panelClassname }) => {
  const { params } = useSearchParams();
  const t = useTranslations();
  const { user } = useAuth();

  const filters = useMemo(() => {
    const filters = [
      getFilterSectionPostType({ t, params }),
      getFilterSectionPostStatus({
        statuses: [
          PostStatus.DRAFT,
          PostStatus.PENDING,
          PostStatus.UPCOMING,
          PostStatus.APPROVED,
          PostStatus.OPEN,
          PostStatus.CLOSED,
          PostStatus.PENDING_RESOLUTION,
          PostStatus.RESOLVED,
          PostStatus.DELETED,
        ],
        t,
        params,
      }),
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
        value: QuestionOrder.OpenTimeDesc,
        label: t("newest"),
      },
      { value: QuestionOrder.CpRevealTimeDesc, label: t("recentlyRevealed") },
      { value: QuestionOrder.NewsHotness, label: t("inTheNews") },
    ],
    [t]
  );

  return (
    <PostsFilters
      filters={filters}
      mainSortOptions={mainSortOptions}
      sortOptions={sortOptions}
      defaultOrder={QuestionOrder.HotDesc}
      panelClassname={panelClassname}
    />
  );
};

export default MyQuestionsAndPostsFilters;
