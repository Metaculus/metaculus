import { useSearchParams } from "next/navigation";

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

  return (
    <GroupForm
      // @ts-ignore
      subtype={searchParams["subtype"]}
      post={post}
      tournament_id={
        searchParams["tournament_id"]
          ? Number(searchParams["tournament_id"])
          : undefined
      }
    ></GroupForm>
  );
};

export default GroupQuestionCreator;
