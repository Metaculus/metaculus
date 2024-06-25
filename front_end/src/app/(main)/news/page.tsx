import { Suspense } from "react";

import AwaitedPostsFeed from "@/components/posts_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { SearchParams } from "@/types/navigation";

import NewsFilters from "./components/news_filters";
import { generateFiltersFromSearchParams } from "./helpers/filters";

export default async function NewsFeed({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = generateFiltersFromSearchParams(searchParams);

  return (
    <main className="mx-auto mb-auto w-full max-w-3xl px-2 pb-4">
      <h1 className="mb-6 mt-12 text-center text-5xl font-bold text-blue-800 dark:text-blue-800-dark">
        Metaculus{" "}
        <span className="text-blue-700 dark:text-blue-700-dark">News</span>
      </h1>
      <NewsFilters />
      <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={
            <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
          }
        >
          <AwaitedPostsFeed filters={filters} />
        </Suspense>
      </div>
    </main>
  );
}
