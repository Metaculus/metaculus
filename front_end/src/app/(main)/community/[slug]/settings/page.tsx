import React from "react";
import invariant from "ts-invariant";

import CommunitySettings from "@/app/(main)/community/[slug]/settings/components/settings";
import ShowActiveCommunityProvider from "@/app/(main)/community/components/community_context";
import CommunityHeader from "@/app/(main)/components/headers/community_header";
import ProjectsApi from "@/services/projects";
import { ProjectPermissions } from "@/types/post";

type Props = {
  params: { slug: string };
};

export default async function CommunityManagementSettings({ params }: Props) {
  const { slug } = params;

  const community = await ProjectsApi.getCommunity(slug);
  invariant(
    community.user_permission === ProjectPermissions.ADMIN,
    `Permission Denied`
  );

  return (
    <ShowActiveCommunityProvider>
      <CommunityHeader community={community} />
      <main className="mx-2 my-4 min-h-min max-w-full flex-auto rounded-lg border border-blue-500 bg-gray-0/50 px-3 py-4 dark:border-blue-600/50 dark:bg-gray-0-dark xs:mx-5 xs:px-8 xs:py-8 md:mx-auto md:max-w-[796px]">
        <CommunitySettings community={community} />
      </main>
    </ShowActiveCommunityProvider>
  );
}
