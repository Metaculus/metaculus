import PostsApi from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";

import NotebookForm from "../../components/notebook_form";
import { extractMode } from "../helpers";

const NotebookCreator: React.FC<{ searchParams: SearchParams }> = async ({
  searchParams,
}) => {
  let post = null;
  if (
    searchParams["post_id"] &&
    searchParams["post_id"] !== null &&
    searchParams["post_id"] !== undefined &&
    Number(searchParams["post_id"]) !== 0
  ) {
    post = await PostsApi.getPost(Number(searchParams["post_id"]));
  }
  const mode = extractMode(searchParams, post);
  const allCategories = await ProjectsApi.getCategories();
  const allTournaments = await ProjectsApi.getTournaments();
  const siteMain = await ProjectsApi.getSiteMain();

  return (
    <NotebookForm
      mode={mode}
      post={post}
      allCategories={allCategories}
      tournament_id={
        searchParams["tournament_id"]
          ? Number(searchParams["tournament_id"])
          : null
      }
      tournaments={allTournaments}
      siteMain={siteMain}
      news_type={
        searchParams["news_type"] ? (searchParams["news_type"] as string) : null
      }
    />
  );
};

export default NotebookCreator;
