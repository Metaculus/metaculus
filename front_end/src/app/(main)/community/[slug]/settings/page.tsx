import React from "react";
import invariant from "ts-invariant";

import CommunitySettings from "@/app/(main)/community/[slug]/settings/components/settings";
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
    <div className="container mx-auto rounded-lg border border-blue-500 bg-white bg-opacity-50 p-8 md:max-w-screen-md">
      <CommunitySettings community={community} />
    </div>
  );
}
