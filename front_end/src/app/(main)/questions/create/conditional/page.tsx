import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import PostsApi from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";

import ConditionalForm from "../../components/conditional_form";
import { extractMode } from "../helpers";

const QuestionConditionalCreator: React.FC<{
  searchParams: SearchParams;
}> = async ({ searchParams }) => {
  let post = null;
  let condition = null;
  let conditionChild = null;
  if (
    searchParams["post_id"] &&
    searchParams["post_id"] !== null &&
    searchParams["post_id"] !== undefined &&
    Number(searchParams["post_id"]) !== 0
  ) {
    post = await PostsApi.getPost(Number(searchParams["post_id"]));
    condition = await PostsApi.getQuestion(
      Number(post?.conditional?.condition.id)
    );
    conditionChild = await PostsApi.getQuestion(
      Number(post?.conditional?.condition_child.id)
    );
  }
  const mode = extractMode(searchParams, post);
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
    <>
      {community ? (
        <CommunityHeader community={community} />
      ) : (
        <Header />
      )}
      <ConditionalForm
        mode={mode}
        post={post}
        conditionParentInit={condition}
        conditionChildInit={conditionChild}
        tournament_id={
          searchParams["tournament_id"]
            ? Number(searchParams["tournament_id"])
            : null
        }
        community_id={community?.id}
        tournaments={allTournaments}
        siteMain={siteMain}
      />
    </>
  );
};

export default WithServerComponentErrorBoundary(QuestionConditionalCreator);
