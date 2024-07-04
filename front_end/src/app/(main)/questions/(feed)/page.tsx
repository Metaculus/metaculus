import { Suspense } from "react";

import MainFeedFilters from "@/components/filters/main_feed_filters";
import AwaitedPostsFeed from "@/components/posts_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { SearchParams } from "@/types/navigation";

import { generateFiltersFromSearchParams } from "../helpers/filters";

export default async function Questions({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = generateFiltersFromSearchParams(searchParams);

  return (
    <>
      <MainFeedFilters />
      <Suspense
        key={JSON.stringify(searchParams)}
        fallback={
          <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
        }
      >
        <AwaitedPostsFeed filters={filters} />
      </Suspense>
    </>
  );
}
