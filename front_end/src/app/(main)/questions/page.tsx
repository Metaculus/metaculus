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
  POST_WEEKLY_TOP_COMMENTS_FILTER,
} from "@/constants/posts_feed";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { SearchParams } from "@/types/navigation";
import { QuestionOrder } from "@/types/question";
import { InterfaceType } from "@/types/users";

import FeedFilters from "./components/feed_filters";
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
      <main className="mx-auto mt-4 min-h-min w-full max-w-5xl flex-auto px-0 sm:px-2 md:px-3">
        <OnboardingCheck />
        <div className="gap-3 p-0 sm:flex sm:flex-row sm:gap-4">
          <FeedSidebar items={sidebarItems} />
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
            ) : isWeeklyTopCommentsFeed ? (
              <Suspense
                key={JSON.stringify(searchParams)}
                fallback={
                  <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
                }
              >
                <AwaitedWeeklyTopCommentsFeed searchParams={searchParams} />
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
                  <AwaitedPostsFeed filters={filters} isCommunity={false} />
                </Suspense>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
