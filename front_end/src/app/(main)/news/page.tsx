import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AwaitedPostsFeed from "@/components/posts_feed";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { SearchParams } from "@/types/navigation";

import NewsFilters from "./components/news_filters";
import { generateFiltersFromSearchParams } from "./helpers/filters";

export const metadata = {
  title: "News | Metaculus",
  description:
    "Latest updates in forecasting, featuring expert insights, community highlights, and platform developments.",
};

export default async function NewsFeed(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const t = await getTranslations();
  const newsCategories = await ServerProjectsApi.getNewsCategories();
  const filters = {
    ...generateFiltersFromSearchParams(searchParams),
    notebook_type: "news",
    curation_status: "approved",
  };

  const newsCategoryId = filters["news_type"]
    ? newsCategories.find((obj) => obj.slug === filters["news_type"])?.id
    : null;

  return (
    <main className="mx-auto mb-auto w-full max-w-3xl px-2 pb-4">
      <h1 className="mb-6 mt-12 text-center text-5xl font-bold text-blue-800 dark:text-blue-800-dark">
        Metaculus{" "}
        <span className="text-blue-700 dark:text-blue-700-dark">News</span>
      </h1>
      <NewsFilters categories={newsCategories} />
      {newsCategoryId && (
        <div className="flex w-full flex-col items-center">
          <Button
            variant="tertiary"
            size="md"
            href={`/questions/create/notebook?news_category_id=${newsCategoryId}`}
          >
            {t("createArticle")}
          </Button>
        </div>
      )}
      <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={
            <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
          }
        >
          <AwaitedPostsFeed filters={filters} type="news" />
        </Suspense>
      </div>
    </main>
  );
}
