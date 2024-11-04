import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import PostsApi from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { ProjectPermissions } from "@/types/post";

import NotebookForm from "../../components/notebook_form";
import { extractMode } from "../helpers";

const NotebookCreator: React.FC<{ searchParams: SearchParams }> = async ({
  searchParams,
}) => {
  let post = null;
  if (
    searchParams["post_id"] &&
    searchParams["post_id"] != null &&
    Number(searchParams["post_id"]) !== 0
  ) {
    post = await PostsApi.getPost(Number(searchParams["post_id"]));
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
    <>
      {community ? (
        <CommunityHeader community={community} />
      ) : (
        <Header />
      )}
      <NotebookForm
        mode={mode}
        post={post}
        allCategories={allCategories}
        tournament_id={
          searchParams["tournament_id"]
            ? Number(searchParams["tournament_id"])
            : null
        }
        community_id={community?.id}
        tournaments={allTournaments}
        siteMain={siteMain}
        news_type={
          searchParams["news_type"]
            ? (searchParams["news_type"] as string)
            : null
        }
      />
    </>
  );
};

export default WithServerComponentErrorBoundary(NotebookCreator);
