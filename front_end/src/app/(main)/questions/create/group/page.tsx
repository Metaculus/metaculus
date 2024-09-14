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
  const allTournaments = await ProjectsApi.getTournaments({
    // Select only projects
    // where user is curator/admin
    permission: ProjectPermissions.CURATOR,
  });
  const siteMain = await ProjectsApi.getSiteMain();

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
      tournaments={allTournaments}
      siteMain={siteMain}
    />
  );
};

export default GroupQuestionCreator;
