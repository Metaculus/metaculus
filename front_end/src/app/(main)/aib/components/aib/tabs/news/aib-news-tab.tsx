import React, { Suspense } from "react";

import AwaitedPostsFeed from "@/components/posts_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POST_NEWS_TYPE_FILTER } from "@/constants/posts_feed";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { QuestionOrder } from "@/types/question";

const ENABLE_FUTUREEVAL_NEWS_FILTER = false;
const FUTUREEVAL_NEWS_SLUG = "futureeval";

const AIBNewsTab: React.FC = async () => {
  const newsCategories = await ServerProjectsApi.getNewsCategories();
  const futureEvalCategory = newsCategories.find(
    (c) =>
      c.slug === FUTUREEVAL_NEWS_SLUG || /future\s*eval/i.test(c.name ?? "")
  );

  const baseNewsFilter = {
    [POST_NEWS_TYPE_FILTER]: newsCategories.map((c) => c.slug),
  };

  const filters = {
    ...baseNewsFilter,
    curation_status: "approved",
    order_by: QuestionOrder.PublishTimeDesc,
    ...(ENABLE_FUTUREEVAL_NEWS_FILTER && futureEvalCategory
      ? { news_type: futureEvalCategory.slug }
      : {}),
  };

  return (
    <div className="w-full">
      <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
        <Suspense
          fallback={
            <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
          }
        >
          <AwaitedPostsFeed filters={filters} type="news" />
        </Suspense>
      </div>
    </div>
  );
};

export default AIBNewsTab;
