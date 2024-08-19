import PostsApi from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";

import ConditionalForm from "../../components/conditional_form";

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
    condition = await PostsApi.getPost(
      Number(post?.conditional?.condition.post_id)
    );
    conditionChild = await PostsApi.getPost(
      Number(post?.conditional?.condition_child.post_id)
    );
  }

  const allTournaments = await ProjectsApi.getTournaments();
  const siteMain = await ProjectsApi.getSiteMain();

  return (
    <ConditionalForm
      mode={post ? "edit" : "create"}
      post={post}
      conditionParentInit={condition}
      conditionChildInit={conditionChild}
      tournament_id={
        searchParams["tournament_id"]
          ? Number(searchParams["tournament_id"])
          : null
      }
      tournaments={allTournaments}
      siteMain={siteMain}
    />
  );
};

export default QuestionConditionalCreator;
