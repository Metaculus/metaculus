import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import CommentFeed from "@/components/comment_feed";
import CommentsApi from "@/services/comments";
import PostsApi from "@/services/posts";

import NotebookEditor from "../components/notebook_editor";

export default async function IndividualNotebook({
  params,
}: {
  params: { id: number };
}) {
  const postData = await PostsApi.getPost(params.id);

  if (!postData || !postData.notebook) {
    return notFound();
  }

  const t = await getTranslations();
  const commentsData = await CommentsApi.getComments({ post: params.id });

  return (
    <div>
      <div className="h-50vh mx-auto max-w-6xl overflow-auto bg-gray-0 dark:bg-gray-100-dark">
        <NotebookEditor postData={postData} />
      </div>
      <div>
        {commentsData && <CommentFeed initialComments={commentsData} />}
      </div>
    </div>
  );
}
