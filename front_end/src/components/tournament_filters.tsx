"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getFilterSectionPostStatus,
  getFilterSectionPostType,
  getFilterSectionUsername,
} from "@/app/(main)/questions/helpers/filters";
import {
  FilterOptionType,
  FilterSection,
} from "@/components/popover_filter/types";
import PostsFilters from "@/components/posts_filters";
import {
  POST_FOLLOWING_FILTER,
  POST_FORECASTER_ID_FILTER,
  POST_NOT_FORECASTER_ID_FILTER,
  POST_STATUS_FILTER,
  POST_WITHDRAWN_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { PostStatus } from "@/types/post";
import { QuestionOrder } from "@/types/question";
import { CurrentUser } from "@/types/users";
import cn from "@/utils/core/cn";

const OPEN_STATUS_FILTERS = [
  QuestionOrder.PublishTimeDesc,
  QuestionOrder.WeeklyMovementDesc,
  QuestionOrder.LastPredictionTimeDesc,
  QuestionOrder.DivergenceDesc,
  QuestionOrder.HotAsc,
  QuestionOrder.CloseTimeAsc,
  QuestionOrder.ScoreDesc,
  QuestionOrder.ScoreAsc,
  QuestionOrder.NewsHotness,
  QuestionOrder.UserNextWithdrawTimeAsc,
  QuestionOrder.LastPredictionTimeAsc,
];
const RESOLVED_STATUS_FILTERS = [QuestionOrder.HotAsc];
const FORECASTER_ID_FILTERS = [
  QuestionOrder.LastPredictionTimeAsc,
  QuestionOrder.LastPredictionTimeDesc,
  QuestionOrder.DivergenceDesc,
  QuestionOrder.UserNextWithdrawTimeAsc,
];

const TournamentFilters: FC = () => {
  const { user } = useAuth();
  const { params } = useSearchParams();
  const t = useTranslations();

  const filters = useMemo(() => {
    return getTournamentPostsFilters({ user, t, params });
  }, [params, t, user]);

  const mainSortOptions = useMemo(
    () => [
      {
        value: QuestionOrder.ActivityDesc,
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
      { value: QuestionOrder.CpRevealTimeDesc, label: t("recentlyRevealed") },
      ...(!!user
        ? [
            {
              value: QuestionOrder.UnreadCommentCountDesc,
              label: t("unreadComments"),
            },
            {
              value: QuestionOrder.LastPredictionTimeAsc,
              label: t("stale"),
            },
            {
              value: QuestionOrder.LastPredictionTimeDesc,
              label: t("newestPredictions"),
              className: cn("block lg:hidden"),
            },
            {
              value: QuestionOrder.UserNextWithdrawTimeAsc,
              label: t("withdrawingSoon"),
            },
            {
              value: QuestionOrder.DivergenceDesc,
              label: t("divergence"),
            },
          ]
        : []),
      { value: QuestionOrder.NewsHotness, label: t("inTheNews") },
    ],
    [t, user]
  );

  const handleOrderChange = (
    order: QuestionOrder,
    setFilterParam: (
      name: string,
      val: string | string[],
      withNavigation?: boolean
    ) => void
  ) => {
    const postStatusFilters = [];

    if (OPEN_STATUS_FILTERS.includes(order)) postStatusFilters.push("open");
    if (RESOLVED_STATUS_FILTERS.includes(order))
      postStatusFilters.push("resolved");

    if (!!user && FORECASTER_ID_FILTERS.includes(order)) {
      setFilterParam(POST_FORECASTER_ID_FILTER, user.id.toString(), false);
    }

    if (postStatusFilters.length) {
      setFilterParam(POST_STATUS_FILTER, postStatusFilters, false);
    }
  };

  return (
    <PostsFilters
      filters={filters}
      mainSortOptions={mainSortOptions}
      sortOptions={sortOptions}
      onOrderChange={handleOrderChange}
      inputConfig={{ debounceTime: 500, mode: "client" }}
    />
  );
};

function getTournamentPostsFilters({
  user,
  t,
  params,
}: {
  t: ReturnType<typeof useTranslations>;
  params: URLSearchParams;
  user: CurrentUser | null;
}): FilterSection[] {
  const filters: FilterSection[] = [
    getFilterSectionPostType({ t, params }),
    getFilterSectionPostStatus({
      t,
      params,
      statuses: [
        PostStatus.DRAFT,
        PostStatus.PENDING,
        PostStatus.OPEN,
        PostStatus.UPCOMING,
        PostStatus.CLOSED,
        PostStatus.PENDING_RESOLUTION,
        PostStatus.RESOLVED,
        PostStatus.DELETED,
      ],
    }),
    getFilterSectionUsername({ t, params }),
  ];

  if (user) {
    filters.push({
      id: "userFilters",
      title: t("myParticipation"),
      type: FilterOptionType.ToggleChip,
      options: [
        {
          id: POST_FORECASTER_ID_FILTER,
          label: t("searchOptionPredicted"),
          value: user.id.toString(),
          active:
            !!params.get(POST_FORECASTER_ID_FILTER) &&
            !params.get(POST_WITHDRAWN_FILTER),
        },
        {
          id: POST_WITHDRAWN_FILTER,
          label: t("searchOptionActivePrediction"),
          value: "false",
          extraValues: {
            [POST_FORECASTER_ID_FILTER]: user.id.toString(),
          },
          active:
            !!params.get(POST_FORECASTER_ID_FILTER) &&
            params.get(POST_WITHDRAWN_FILTER) === "false",
        },
        {
          id: POST_WITHDRAWN_FILTER,
          label: t("searchOptionWithdrawnPrediction"),
          value: "true",
          extraValues: {
            [POST_FORECASTER_ID_FILTER]: user.id.toString(),
          },
          active:
            !!params.get(POST_FORECASTER_ID_FILTER) &&
            params.get(POST_WITHDRAWN_FILTER) === "true",
        },
        {
          id: POST_NOT_FORECASTER_ID_FILTER,
          label: t("searchOptionNotPredicted"),
          value: user.id.toString(),
          active: !!params.get(POST_NOT_FORECASTER_ID_FILTER),
        },
        {
          id: POST_FOLLOWING_FILTER,
          label: t("followed"),
          value: "true",
          active: !!params.get(POST_FOLLOWING_FILTER),
        },
      ],
    });
  }

  return filters;
}

export default TournamentFilters;
