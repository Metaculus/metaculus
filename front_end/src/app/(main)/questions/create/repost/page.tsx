import invariant from "ts-invariant";

import CommunityHeader from "@/app/(main)/components/headers/community_header";
import RepostForm from "@/app/(main)/questions/components/repost";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";

const RepostCreator: React.FC<{ searchParams: SearchParams }> = async ({
  searchParams,
}) => {
  const communityId = searchParams["community_id"]
    ? Number(searchParams["community_id"])
    : undefined;

  invariant(communityId, "Community is required!");

  const communitiesResponse = await ProjectsApi.getCommunities({
    ids: [communityId],
  });

  const community = communitiesResponse
    ? communitiesResponse.results[0]
    : undefined;

  invariant(community, "Wrong community id!");

  return (
    <>
      <CommunityHeader community={community} />
      <RepostForm community={community} />
    </>
  );
};

export default RepostCreator;
