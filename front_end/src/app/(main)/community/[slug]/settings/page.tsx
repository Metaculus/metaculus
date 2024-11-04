import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import React, { Suspense } from "react";

import CommunitySettings from "@/app/(main)/community/[slug]/settings/components/settings";
import CommunityHeader from "@/app/(main)/components/headers/community_header";
import { generateFiltersFromSearchParams } from "@/app/(main)/questions/helpers/filters";
import AwaitedPostsFeed from "@/components/posts_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { PostsParams } from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { ProjectPermissions } from "@/types/post";
import { CommunitySettingsMode } from "@/types/projects";
import { QuestionOrder } from "@/types/question";

import CommunityFilters from "./components/community_filters";
import CommunityManagement from "./components/community_management";

type Props = {
  params: { slug: string };
  searchParams: SearchParams;
};

export default async function CommunityManagementSettings({
  params,
  searchParams,
}: Props) {
  const { slug } = params;
  const t = await getTranslations();
  const community = await ProjectsApi.getCommunity(slug);
  if (community.user_permission !== ProjectPermissions.ADMIN) {
    return redirect(`/community/${community.slug}`);
  }

  const questionFilters = generateFiltersFromSearchParams(searchParams, {
    defaultOrderBy: QuestionOrder.HotDesc,
  });
  const pageFilters: PostsParams = {
    ...questionFilters,
    community: slug,
  };

  const mode = (searchParams.mode ||
    CommunitySettingsMode.Questions) as CommunitySettingsMode;
  return (
    <>
      <CommunityHeader community={community} />
      <main className="mx-2 my-4 min-h-min max-w-full flex-auto rounded-lg border border-blue-500 bg-gray-0/50 px-3 py-4 dark:border-blue-600/50 dark:bg-gray-0-dark xs:mx-5 xs:px-8 xs:py-8 md:mx-auto md:max-w-[796px]">
        <CommunityManagement community={community} mode={mode} />
        {mode === CommunitySettingsMode.Questions && (
          <>
            <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-0 no-scrollbar sm:p-0">
              <h1 className="m-0 truncate text-xl font-medium text-blue-900 dark:text-blue-900-dark xs:max-w-full xs:text-2xl">
                {t("questions")}
              </h1>
              <CommunityFilters community={community} />
              <Suspense
                key={JSON.stringify(searchParams)}
                fallback={
                  <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
                }
              >
                <AwaitedPostsFeed filters={pageFilters} isCommunity />
              </Suspense>
            </div>
          </>
        )}
        {mode === CommunitySettingsMode.Settings && (
          <CommunitySettings community={community} />
        )}
      </main>
    </>
  );
}
