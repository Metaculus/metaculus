import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";

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

  return (
    <GroupForm
      // @ts-ignore
      subtype={
        post
          ? post.group_of_questions?.questions[0]?.type
          : searchParams["subtype"]
      }
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
  );
};

export default WithServerComponentErrorBoundary(GroupQuestionCreator);
