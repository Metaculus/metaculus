import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import PostsApi from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { ProjectPermissions } from "@/types/post";

import QuestionForm from "../../components/question_form";
import { extractMode } from "../helpers";

const QuestionCreator: React.FC<{ searchParams: SearchParams }> = async ({
  searchParams,
}) => {
  let post = null;
  if (searchParams["post_id"]) {
    post = await PostsApi.getPost(Number(searchParams["post_id"]));
  }
  if (!post && !searchParams["type"]) {
    throw new Error("Type is required !");
  }

  const allCategories = await ProjectsApi.getCategories();
  const question_type: string = post
    ? (post.question?.type as string)
    : (searchParams["type"] as string);
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
      <QuestionForm
        post={post}
        questionType={question_type}
        mode={mode}
        tournament_id={
          searchParams["tournament_id"]
            ? Number(searchParams["tournament_id"])
            : undefined
        }
        community_id={community?.id}
        allCategories={allCategories}
        tournaments={allTournaments}
        siteMain={siteMain}
      />
    </>
  );
};

export default WithServerComponentErrorBoundary(QuestionCreator);
