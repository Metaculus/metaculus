import { isNil } from "lodash";
import { Suspense } from "react";

import FeedSidebar from "@/app/(main)/questions/components/sidebar";
import AwaitedCommunitiesFeed from "@/components/communities_feed";
import OnboardingCheck from "@/components/onboarding/onboarding_check";
import AwaitedPostsFeed from "@/components/posts_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import AwaitedWeeklyTopCommentsFeed from "@/components/weekly_top_comments_feed";
import {
  POST_COMMUNITIES_FILTER,
  POST_PAGE_FILTER,
  POST_WEEKLY_TOP_COMMENTS_FILTER,
} from "@/constants/posts_feed";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { SearchParams } from "@/types/navigation";
import { QuestionOrder } from "@/types/question";
import { InterfaceType } from "@/types/users";

import FeedFilters from "./components/feed_filters";
import StickyFilterBar from "./components/sticky_filter_bar";
import { generateFiltersFromSearchParams } from "./helpers/filters";

export const metadata = {
  title: "Question Feed | Metaculus",
  description:
    "Explore a diverse range of forecasting questions on Metaculus, covering global issues, scientific breakthroughs, and future events.",
};

export default async function Questions(props: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await ServerProfileApi.getMyProfile();

  const searchParams = await props.searchParams;
  const isCommunityFeed = searchParams[POST_COMMUNITIES_FILTER];
  const isWeeklyTopCommentsFeed = searchParams[POST_WEEKLY_TOP_COMMENTS_FILTER];
  const filters = generateFiltersFromSearchParams(searchParams, {
    // Default Feed ordering should be hotness
    defaultOrderBy: QuestionOrder.HotDesc,
    defaultForMainFeed: true,
    filterForConsumerView:
      isNil(user) || user.interface_type === InterfaceType.ConsumerView,
  });
  const sidebarItems = await serverMiscApi.getSidebarItems();

  return (
    <>
      <main className="min-h-[calc(100vh-3rem)] w-full flex-auto">
        <OnboardingCheck />
        <div className="flex flex-col sm:flex-row">
          <FeedSidebar items={sidebarItems} />
          {isCommunityFeed ? (
            <div className="mx-auto min-h-[calc(100vh-300px)] w-full max-w-5xl grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-4 sm:pt-5">
              <Suspense
                key={JSON.stringify(searchParams)}
                fallback={
                  <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
                }
              >
                <AwaitedCommunitiesFeed />
              </Suspense>
            </div>
          ) : isWeeklyTopCommentsFeed ? (
            <div className="mx-auto min-h-[calc(100vh-300px)] w-full max-w-5xl grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-4 sm:pt-5">
              <Suspense
                key={JSON.stringify(searchParams)}
                fallback={
                  <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
                }
              >
                <AwaitedWeeklyTopCommentsFeed searchParams={searchParams} />
              </Suspense>
            </div>
          ) : (
            <div className="min-w-0 grow">
              <StickyFilterBar>
                <FeedFilters withProjectFilters />
              </StickyFilterBar>
              <div className="isolate mx-auto min-h-[calc(100vh-300px)] w-full max-w-5xl overflow-x-hidden p-2 pb-2 no-scrollbar sm:p-4 sm:pb-4">
                <Suspense
                  key={JSON.stringify(searchParams)}
                  fallback={
                    <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
                  }
                >
                  <AwaitedPostsFeed
                    filters={filters}
                    isCommunity={false}
                    showProjectTiles={Object.keys(searchParams).every(
                      (key) => key === POST_PAGE_FILTER
                    )}
                  />
                </Suspense>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
