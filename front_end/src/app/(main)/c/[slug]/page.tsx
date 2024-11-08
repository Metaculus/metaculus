import { Suspense } from "react";

import AwaitedPostsFeed from "@/components/posts_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { PostsParams } from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { QuestionOrder } from "@/types/question";

import CommunityHeader from "../../components/headers/community_header";
import FeedFilters from "../../questions/components/feed_filters";
import { generateFiltersFromSearchParams } from "../../questions/helpers/filters";
import ShowActiveCommunityProvider from "../components/community_context";
import CommunityInfo from "../components/community_info";

type Props = {
  params: { slug: string };
  searchParams: SearchParams;
};

export default async function IndividualCommunity({
  params,
  searchParams,
}: Props) {
  const { slug } = params;
  const community = await ProjectsApi.getCommunity(slug);

  const questionFilters = generateFiltersFromSearchParams(searchParams, {
    defaultOrderBy: QuestionOrder.HotDesc,
  });
  const pageFilters: PostsParams = {
    ...questionFilters,
    community: slug,
  };
  return (
    <ShowActiveCommunityProvider>
      <CommunityHeader community={community} alwaysShowName={false} />
      <main className="mx-2 my-4 min-h-min max-w-full flex-auto rounded-lg border border-blue-500 bg-gray-0/50 px-3 py-4 dark:border-blue-600/50 dark:bg-gray-0-dark xs:mx-5 xs:px-8 xs:py-8 md:mx-auto md:max-w-[796px]">
        <CommunityInfo community={community} />

        <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
          <FeedFilters />
          <Suspense
            key={JSON.stringify(searchParams)}
            fallback={
              <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
            }
          >
            <AwaitedPostsFeed filters={pageFilters} />
          </Suspense>
        </div>
      </main>
    </ShowActiveCommunityProvider>
  );
}
