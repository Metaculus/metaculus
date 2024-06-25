import { Suspense } from "react";

import AwaitedPostsFeed from "@/components/posts_feed";
import PostsFilters from "@/components/posts_filters";
import SearchInput from "@/components/search_input";
import LoadingIndicator from "@/components/ui/loading_indicator";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";

import NewsFilters from "./components/news_filters";

export default async function NewsFeed({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto mt-4 min-h-min w-full max-w-5xl flex-auto px-0 sm:px-2 md:px-3">
      <div className="text-3xl">Metaculus News</div>
      <NewsFilters />
      <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={
            <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
          }
        >
          <AwaitedPostsFeed filters={{ forecast_type: "notebook" }} />
        </Suspense>
      </div>
    </main>
  );
}
