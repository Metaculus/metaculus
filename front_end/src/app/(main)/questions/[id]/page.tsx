import { faEllipsis, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notFound } from "next/navigation";

import CommentFeed from "@/components/comment_feed";
import ConditionalTile from "@/components/conditional_tile";
import ForecastMaker from "@/components/forecast_maker";
import CommentsApi from "@/services/comments";
import PostsApi from "@/services/posts";

import DetailedQuestionCard from "./components/detailed_question_card";

export default async function IndividualQuestion({
  params,
}: {
  params: { id: number };
}) {
  const postData = await PostsApi.getPost(params.id);

  if (!postData) {
    return notFound();
  }

  const commentsData = await CommentsApi.getComments({ post: params.id });

  return (
    <main className="flex flex-row justify-center gap-2 p-6">
      <div className="w-[700px] bg-white  p-4 dark:bg-blue-900">
        <span className="m-2 bg-blue-400 p-1 text-xl font-extrabold text-blue-700">
          Question
        </span>
        {!postData.conditional && (
          <h1 className="text-bold text-2xl dark:text-white">
            {postData?.title}
          </h1>
        )}

        {postData.conditional && (
          <ConditionalTile
            conditional={postData.conditional}
            curationStatus={postData.curation_status}
          />
        )}
        {postData.question && (
          <DetailedQuestionCard question={postData.question} />
        )}
        <div className="p-6 dark:bg-blue-800">
          <ForecastMaker
            question={postData.question}
            conditional={postData.conditional}
          />
        </div>
        {commentsData && <CommentFeed initialComments={commentsData} />}
      </div>
      <div className="flex max-w-[240px] flex-col bg-white p-4 dark:bg-blue-800">
        <div className="flex w-[200px] flex-row justify-between border-b pb-4 pt-4">
          <button>Embed</button>
          <div>
            <span className="m-1">
              <FontAwesomeIcon icon={faShareNodes}></FontAwesomeIcon>
            </span>
            <span className="m-1">
              <FontAwesomeIcon icon={faEllipsis}></FontAwesomeIcon>
            </span>
          </div>
        </div>
        <div className="mt-2 flex flex-col border-b pb-4 pt-4">
          <div className="flex flex-row justify-between">
            <span>Author:</span>
            <a href={`/accounts/profile/${postData.author_id}`}>
              {postData.author_username}
            </a>
          </div>
          <div className="flex flex-row justify-between">
            <span>Opened:</span>
            <span>
              {postData.published_at && postData.published_at.slice(0, 7)}
            </span>
          </div>
          <div className="flex flex-row justify-between">
            <span>Closed:</span>
            <span>
              {postData.question?.closed_at &&
                postData.question?.closed_at.slice(0, 7)}
            </span>
          </div>
          <div className="flex flex-row justify-between">
            <span>Resolved:</span>
            <span>
              {postData.question?.resolved_at &&
                postData.question?.resolved_at.slice(0, 7)}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
