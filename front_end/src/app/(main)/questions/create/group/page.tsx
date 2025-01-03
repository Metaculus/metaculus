import { isNil } from "lodash";

import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { PostWithForecasts } from "@/types/post";

import { getPost } from "../../actions";
import GroupForm from "../../components/group_form";
import { extractMode } from "../helpers";

const GroupQuestionCreator: React.FC<{ searchParams: SearchParams }> = async ({
  searchParams,
}) => {
  const post_id = searchParams["post_id"];
  let post: PostWithForecasts | null = null;
  if (post_id) {
    post = await getPost(Number(post_id));
  }
  const mode = extractMode(searchParams, post);
  const allCategories = await ProjectsApi.getCategories();
  const allTournaments = await ProjectsApi.getTournaments();
  const siteMain = await ProjectsApi.getSiteMain();

  const communityId = searchParams["community_id"]
    ? Number(searchParams["community_id"])
    : undefined;
  const communitiesResponse = communityId
    ? await ProjectsApi.getCommunities({ ids: [communityId] })
    : undefined;
  const community = communitiesResponse
    ? communitiesResponse.results[0]
    : undefined;

  const groupType = post
    ? post.group_of_questions?.questions[0]?.type
    : (searchParams["subtype"] as string);

  return (
    <>
      {community ? <CommunityHeader community={community} /> : <Header />}

      {!isNil(groupType) && (
        <GroupForm
          subtype={groupType}
          post={post}
          mode={mode}
          allCategories={allCategories}
          tournament_id={
            searchParams["tournament_id"]
              ? Number(searchParams["tournament_id"])
              : undefined
          }
          community_id={community?.id}
          tournaments={allTournaments}
          siteMain={siteMain}
        />
      )}
    </>
  );
};

export default GroupQuestionCreator;
