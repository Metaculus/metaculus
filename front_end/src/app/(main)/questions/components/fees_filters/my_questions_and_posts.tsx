"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getFilterSectionPostType,
  POST_STATUS_LABEL_MAP,
} from "@/app/(main)/questions/helpers/filters";
import { FilterOptionType } from "@/components/popover_filter/types";
import PostsFilters from "@/components/posts_filters";
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
          // TODO: add upcoming
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

  const mainSortOptions = [
    {
      id: QuestionOrder.DivergenceDesc,
      label: t("hot"),
    },
    {
      id: QuestionOrder.WeeklyMovementDesc,
      label: t("movers"),
    },
    {
      id: QuestionOrder.PredictionCountDesc,
      label: t("mostPredictions"),
    },
  ];

  return <PostsFilters filters={filters} mainSortOptions={mainSortOptions} />;
};

export default MyQuestionsAndPostsFilters;
