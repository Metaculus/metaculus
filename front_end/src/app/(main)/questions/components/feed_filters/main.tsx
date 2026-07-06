"use client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getFilterSectionParticipation,
  getFilterSectionPostStatus,
  getFilterSectionPostType,
  getFilterSectionProjects,
  getFilterSectionUsername,
} from "@/app/(main)/questions/helpers/filters";
import { useFeedQuery } from "@/app/(main)/questions/hooks/use_feed_query";
import PostsFilters from "@/components/posts_filters";
import { GroupButton } from "@/components/ui/button_group";
import {
  POST_FOLLOWING_FILTER,
  POST_STATUS_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import ClientProjectsApi from "@/services/api/projects/projects.client";
import { PostStatus } from "@/types/post";
import { QuestionOrder } from "@/types/question";

type Props = {
  following?: boolean;
  withProjectFilters?: boolean;
  panelClassname?: string;
  variant?: "full" | "mobileActions";
  hideMobileActions?: boolean;
};

const MainFeedFilters: FC<Props> = ({
  following,
  withProjectFilters = false,
  panelClassname,
  variant,
  hideMobileActions,
}) => {
  const { params } = useFeedQuery();
  const t = useTranslations();
  const { user } = useAuth();
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();

  const projectFilters = useProjectFilters(withProjectFilters);

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
      if (user.is_superuser && projectFilters) {
        filters.push(
          getFilterSectionProjects({ t, params, projects: projectFilters })
        );
      }
    }
    return filters;
  }, [params, t, user, projectFilters]);

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
      ...(!PUBLIC_MINIMAL_UI
        ? [
            {
              value: QuestionOrder.NewsHotness,
              label: t("inTheNews"),
            },
          ]
        : []),
      {
        value: QuestionOrder.ResolveTimeAsc,
        label: t("resolvingSoon"),
        className: "sm:hidden",
      },
    ],
    [t, PUBLIC_MINIMAL_UI]
  );

  const sortOptions = useMemo(
    () => [
      { value: QuestionOrder.VotesDesc, label: t("mostUpvotes") },
      { value: QuestionOrder.CommentCountDesc, label: t("mostComments") },
      {
        value: QuestionOrder.UnreadCommentCountDesc,
        label: t("newComments"),
      },
      {
        value: QuestionOrder.PredictionCountDesc,
        label: t("mostPredictions"),
      },
      {
        value: QuestionOrder.ForecastersCountDesc,
        label: t("mostForecasters"),
      },
      { value: QuestionOrder.CloseTimeAsc, label: t("closingSoon") },
      { value: QuestionOrder.ResolveTimeAsc, label: t("resolvingSoon") },
      { value: QuestionOrder.CpRevealTimeDesc, label: t("recentlyRevealed") },
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
        QuestionOrder.PublishTimeDesc,
        QuestionOrder.CloseTimeAsc,
        QuestionOrder.NewsHotness,
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
      panelClassname={panelClassname}
      variant={variant}
      hideMobileActions={hideMobileActions}
    />
  );
};

const useProjectFilters = (withProjectFilters: boolean) => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["feed-project-filters"],
    queryFn: async () => {
      const [tournaments, siteMain] = await Promise.all([
        ClientProjectsApi.getTournaments(),
        ClientProjectsApi.getSiteMain(),
      ]);
      return [siteMain, ...tournaments];
    },
    enabled: withProjectFilters && !!user?.is_superuser,
    staleTime: 5 * 60 * 1000,
  });

  return data;
};

export default MainFeedFilters;
