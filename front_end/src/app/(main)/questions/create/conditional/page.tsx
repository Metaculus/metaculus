import PostsApi from "@/services/posts";
import { SearchParams } from "@/types/navigation";

import ConditionalForm from "../../components/conditional_form";

const QuestionConditionalCreator: React.FC<{
  searchParams: SearchParams;
}> = async ({ searchParams }) => {
  let post = null;
  let condition = null;
  let conditionChild = null;
  if (searchParams["post_id"]) {
    post = await PostsApi.getPost(Number(searchParams["post_id"]));
    condition = await PostsApi.getPost(
      Number(post?.conditional?.condition.post_id)
    );
    conditionChild = await PostsApi.getPost(
      Number(post?.conditional?.condition_child.post_id)
    );
  }

  return (
    <ConditionalForm
      mode={post ? "edit" : "create"}
      post={post}
      conditionInit={condition}
      conditionChildInit={conditionChild}
      tournament_id={
        searchParams["tournament_id"]
          ? Number(searchParams["tournament_id"])
          : null
      }
    ></ConditionalForm>
  );
};

export default QuestionConditionalCreator;
