import { useSearchParams } from "next/navigation";

import { SearchParams } from "@/types/navigation";
import { PostWithForecasts } from "@/types/post";

import { getPost } from "../../actions";
import QuestionForm from "../../components/question_form_old";

const GroupQuestionCreator: React.FC<{ searchParams: SearchParams }> = async ({
  searchParams,
}) => {
  const post_id = searchParams["post_id"];
  let post: PostWithForecasts | null = null;
  if (post_id) {
    post = await getPost(Number(post_id));
  }
  return <QuestionForm question_type={"group"} post={post}></QuestionForm>;
};

export default GroupQuestionCreator;
