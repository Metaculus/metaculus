"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import {
  getFilterSectionParticipation,
  getFilterSectionPostStatus,
  getFilterSectionPostType,
  getFilterSectionProjects,
  getFilterSectionUsername,
} from "@/app/(main)/questions/helpers/filters";
import PostsFilters from "@/components/posts_filters";
import { GroupButton } from "@/components/ui/button_group";
import {
  POST_FOLLOWING_FILTER,
  POST_STATUS_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import { useBreakpoint } from "@/hooks/tailwind";
import useSearchParams from "@/hooks/use_search_params";
import ClientProjectsApi from "@/services/api/projects/projects.client";
import { PostStatus } from "@/types/post";
import { TournamentPreview } from "@/types/projects";
import { QuestionOrder } from "@/types/question";

type Props = {
  following?: boolean;
  withProjectFilters?: boolean;
  panelClassname?: string;
};

const MainFeedFilters: FC<Props> = ({
  following,
  withProjectFilters = false,
  panelClassname,
}) => {
  const { params } = useSearchParams();
  const t = useTranslations();
  const { user } = useAuth();

  const isLargeScreen = useBreakpoint("md");

  const [projectFilters, setProjectFilters] = useState<
    TournamentPreview[] | undefined
  >();
  const fetchProjectFilters = useFetchProjectFilters();

  useEffect(() => {
    const loadProjectFilters = async () => {
      const filters = await fetchProjectFilters();
      if (filters) {
        setProjectFilters(filters);
      }
    };

    if (withProjectFilters) {
      void loadProjectFilters();
    }
  }, [fetchProjectFilters, withProjectFilters]);

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

  const mainSortNewsVisible = isLargeScreen || isNil(user);
  const mainSortNewVisible = isLargeScreen || !isNil(user);

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
      ...(mainSortNewVisible
        ? [
            {
              value: QuestionOrder.OpenTimeDesc,
              label: t("new"),
            },
          ]
        : []),
      ...(mainSortNewsVisible
        ? [
            {
              value: QuestionOrder.NewsHotness,
              label: t("inTheNews"),
            },
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, isLargeScreen]
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
      ...(!mainSortNewVisible
        ? [{ value: QuestionOrder.OpenTimeDesc, label: t("new") }]
        : []),
      ...(!mainSortNewsVisible
        ? [{ value: QuestionOrder.NewsHotness, label: t("inTheNews") }]
        : []),
    ],
    [mainSortNewVisible, mainSortNewsVisible, t]
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
      showRandomButton
      panelClassname={panelClassname}
    />
  );
};

const useFetchProjectFilters = () => {
  const { user } = useAuth();

  return useCallback(async () => {
    if (!user?.is_superuser) {
      return null;
    }

    try {
      const [tournaments, siteMain] = await Promise.all([
        ClientProjectsApi.getTournaments(),
        ClientProjectsApi.getSiteMain(),
      ]);
      return [siteMain, ...tournaments];
    } catch {
      return null;
    }
  }, [user?.is_superuser]);
};

export default MainFeedFilters;
