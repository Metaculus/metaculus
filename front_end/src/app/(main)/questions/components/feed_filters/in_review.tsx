"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getFilterSectionPostType,
  getFilterSectionUsername,
  POST_STATUS_LABEL_MAP,
} from "@/app/(main)/questions/helpers/filters";
import { FilterOptionType } from "@/components/popover_filter/types";
import PostsFilters from "@/components/posts_filters";
import { POST_STATUS_FILTER } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { PostStatus } from "@/types/post";
import { QuestionOrder } from "@/types/question";

const InReviewFeed: FC = () => {
  const { params } = useSearchParams();
  const t = useTranslations();

  const filters = useMemo(() => {
    return [
      getFilterSectionPostType({ t, params }),
      getFilterSectionUsername({ t, params }),
    ];
  }, [params, t]);

  const mainSortOptions = useMemo(
    () => [
      {
        id: QuestionOrder.ActivityDesc,
        label: t("hot"),
      },
      {
        id: QuestionOrder.PublishTimeDesc,
        label: t("new"),
      },
    ],
    [t]
  );

  return <PostsFilters filters={filters} mainSortOptions={mainSortOptions} />;
};

export default InReviewFeed;
