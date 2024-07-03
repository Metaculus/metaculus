import PostsApi from "@/services/posts";
import { SearchParams } from "@/types/navigation";

import QuestionForm from "../../components/question_form";

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

  const question_type: string = post
    ? (post.question?.type as string)
    : (searchParams["type"] as string);

  return (
    <QuestionForm
      post={post}
      questionType={question_type}
      mode={post ? "edit" : "create"}
      tournament_id={
        searchParams["tournament_id"]
          ? Number(searchParams["tournament_id"])
          : undefined
      }
    ></QuestionForm>
  );
};

export default QuestionCreator;
