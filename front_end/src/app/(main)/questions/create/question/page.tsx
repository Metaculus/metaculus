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
  const allTournaments = await ProjectsApi.getTournaments({
    // Show projects where current user is curator or admin
    permission: ProjectPermissions.CURATOR,
  });
  const siteMain = await ProjectsApi.getSiteMain();

  return (
    <QuestionForm
      post={post}
      questionType={question_type}
      mode={mode}
      tournament_id={
        searchParams["tournament_id"]
          ? Number(searchParams["tournament_id"])
          : undefined
      }
      allCategories={allCategories}
      tournaments={allTournaments}
      siteMain={siteMain}
    />
  );
};

export default QuestionCreator;
