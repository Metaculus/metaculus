import { Suspense } from "react";

import AwaitedCommunitiesFeed from "@/components/communities_feed";
import OnboardingCheck from "@/components/onboarding/onboarding_check";
import AwaitedPostsFeed from "@/components/posts_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POST_COMMUNITIES_FILTER } from "@/constants/posts_feed";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { QuestionOrder } from "@/types/question";

import FeedFilters from "./components/feed_filters";
import QuestionTopics from "./components/question_topics";
import { generateFiltersFromSearchParams } from "./helpers/filters";

export const metadata = {
  title: "Question Feed | Metaculus",
  description:
    "Explore a diverse range of forecasting questions on Metaculus, covering global issues, scientific breakthroughs, and future events.",
};

export default async function Questions(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const isCommunityFeed = searchParams[POST_COMMUNITIES_FILTER];
  const filters = generateFiltersFromSearchParams(searchParams, {
    // Default Feed ordering should be hotness
    defaultOrderBy: QuestionOrder.HotDesc,
    defaultForMainFeed: true,
  });
  const topics = await ProjectsApi.getTopics();

  return (
    <>
      <main className="mx-auto mt-4 min-h-min w-full max-w-5xl flex-auto px-0 sm:px-2 md:px-3">
        <OnboardingCheck />
        <div className="gap-3 p-0 sm:flex sm:flex-row sm:gap-4">
          <QuestionTopics topics={topics} />
          <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
            {isCommunityFeed ? (
              <Suspense
                key={JSON.stringify(searchParams)}
                fallback={
                  <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
                }
              >
                <AwaitedCommunitiesFeed />
              </Suspense>
            ) : (
              <>
                <div id="existing-search">
                  <FeedFilters withProjectFilters />
                </div>
                <Suspense
                  key={JSON.stringify(searchParams)}
                  fallback={
                    <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
                  }
                >
                  <AwaitedPostsFeed filters={filters} topics={topics} />
                </Suspense>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
