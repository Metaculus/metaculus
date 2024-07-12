"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getFilterSectionPostType,
  getFilterSectionUsername,
} from "@/app/(main)/questions/helpers/filters";
import PostsFilters from "@/components/posts_filters";
import { GroupButton } from "@/components/ui/button_group";
import useSearchParams from "@/hooks/use_search_params";
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

  const mainSortOptions: GroupButton<QuestionOrder>[] = useMemo(
    () => [
      {
        value: QuestionOrder.HotDesc,
        label: t("hot"),
      },
      {
        value: QuestionOrder.PublishTimeDesc,
        label: t("new"),
      },
    ],
    [t]
  );

  return (
    <PostsFilters
      filters={filters}
      mainSortOptions={mainSortOptions}
      defaultOrder={QuestionOrder.HotDesc}
    />
  );
};

export default InReviewFeed;
