"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getFilterSectionPostType,
  POST_STATUS_LABEL_MAP,
} from "@/app/(main)/questions/helpers/filters";
import PostsFilters from "@/components/filters/posts_filters";
import { FilterOptionType } from "@/components/popover_filter/types";
import { POST_STATUS_FILTER } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { PostStatus } from "@/types/post";
import { QuestionOrder } from "@/types/question";

const MyPredictionsFilters: FC = () => {
  const { user } = useAuth();
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
          PostStatus.APPROVED,
          PostStatus.CLOSED,
          PostStatus.RESOLVED,
        ].map((status) => ({
          label: POST_STATUS_LABEL_MAP[status],
          value: status,
          active: params.getAll(POST_STATUS_FILTER).includes(status),
        })),
      },
    ];
  }, [params, t]);

  const mainSortOptions = [
    {
      id: QuestionOrder.WeeklyMovementDesc,
      label: t("movers"),
    },
    {
      id: QuestionOrder.DivergenceDesc,
      label: t("hot"),
    },
    {
      id: QuestionOrder.StaleDesc,
      label: t("stale"),
    },
    {
      id: QuestionOrder.NewCommentsDesc,
      label: t("newComments"),
    },
  ];

  return <PostsFilters filters={filters} mainSortOptions={mainSortOptions} />;
};

export default MyPredictionsFilters;
