import { Metadata } from "next";
import { Suspense } from "react";

import ProjectContributions from "@/app/(main)/(leaderboards)/contributions/components/project_contributions";
import ProjectLeaderboard from "@/app/(main)/(leaderboards)/leaderboard/components/project_leaderboard";
import { TopChromeHeaderSetter } from "@/app/(main)/components/top_chrome_header_context";
import AwaitedPostsFeed from "@/components/posts_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { defaultDescription } from "@/constants/metadata";
import { PostsParams } from "@/services/api/posts/posts.shared";
import ServerProfileApi from "@/services/api/profile/profile.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { SearchParams } from "@/types/navigation";
import { ProjectVisibility } from "@/types/projects";
import { QuestionOrder } from "@/types/question";
import { stripHtmlTags } from "@/utils/formatters/string";

import FeedFilters from "../../questions/components/feed_filters";
import { generateFiltersFromSearchParams } from "../../questions/helpers/filters";
import { FeedQueryProvider } from "../../questions/hooks/use_feed_query";
import CommunityInfo from "../components/community_info";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const community = await ServerProjectsApi.getCommunity(params.slug);

  if (!community) {
    return {};
  }
  const parsedDescription = stripHtmlTags(community.description).split("\n")[0];

  return {
    title: community.name,
    description: !!parsedDescription ? parsedDescription : defaultDescription,
    // Hide unlisted pages from search engines
    ...(community.visibility === ProjectVisibility.Unlisted
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

export default async function IndividualCommunity(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { slug } = params;
  const currentUser = await ServerProfileApi.getMyProfile();
  const community = await ServerProjectsApi.getCommunity(slug);
  const questionFilters = generateFiltersFromSearchParams(searchParams, {
    defaultOrderBy: QuestionOrder.HotDesc,
  });
  const pageFilters: PostsParams = {
    ...questionFilters,
    community: slug,
  };
  return (
    <>
      <TopChromeHeaderSetter
        header={{
          type: "community",
          community,
          alwaysShowName: false,
        }}
      />
      <main className="mx-2 my-4 min-h-min max-w-full flex-auto rounded-lg border border-blue-500 bg-gray-0/50 px-3 py-4 dark:border-blue-600/50 dark:bg-gray-0-dark xs:mx-5 xs:px-8 xs:py-8 md:mx-auto md:max-w-[796px]">
        <CommunityInfo community={community} />
        <div className="mt-3 flex flex-col gap-3">
          <ProjectLeaderboard
            projectId={community.id}
            userId={currentUser?.id}
            isQuestionSeries
          />
          {currentUser && (
            <Suspense
              fallback={
                <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
              }
            >
              <ProjectContributions
                project={community}
                userId={currentUser.id}
              />
            </Suspense>
          )}
        </div>

        <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
          <FeedQueryProvider
            filterUpdateOptions={{
              history: "push",
              scroll: true,
              shallow: false,
            }}
          >
            <FeedFilters />
            <Suspense
              key={JSON.stringify(searchParams)}
              fallback={
                <LoadingSpinner className="mx-auto h-8 w-8 text-gray-600 dark:text-gray-600-dark" />
              }
            >
              <AwaitedPostsFeed
                filters={pageFilters}
                isCommunity={true}
                forceLayout="list"
                isFeedQueryProvided
              />
            </Suspense>
          </FeedQueryProvider>
        </div>
      </main>
    </>
  );
}
