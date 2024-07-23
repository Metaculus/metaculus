import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { PostWithForecasts } from "@/types/post";

import { getPost } from "../../actions";
import GroupForm from "../../components/group_form";

const GroupQuestionCreator: React.FC<{ searchParams: SearchParams }> = async ({
  searchParams,
}) => {
  const post_id = searchParams["post_id"];
  let post: PostWithForecasts | null = null;
  if (post_id) {
    post = await getPost(Number(post_id));
  }
  const allCategories = await ProjectsApi.getCategories();
  const allTournaments = await ProjectsApi.getTournaments();
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
      mode={post ? "edit" : "create"}
      allCategories={allCategories}
      tournament_id={
        searchParams["tournament_id"]
          ? Number(searchParams["tournament_id"])
          : undefined
      }
      tournaments={allTournaments}
      siteMain={siteMain}
    ></GroupForm>
  );
};

export default GroupQuestionCreator;
