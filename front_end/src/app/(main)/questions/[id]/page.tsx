import { faEllipsis, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import CommentFeed from "@/components/comment_feed";
import ConditionalTile from "@/components/conditional_tile";
import ForecastMaker from "@/components/forecast_maker";
import Button from "@/components/ui/button";
import CommentsApi from "@/services/comments";
import PostsApi from "@/services/posts";

import DetailedGroupCard from "./components/detailed_group_card";
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

  const t = await getTranslations();
  const commentsData = await CommentsApi.getComments({ post: params.id });

  return (
    <main className="mx-auto flex w-full max-w-max flex-col py-4">
      <div className="flex items-start gap-3 bg-gray-0 px-3 pt-3 dark:bg-gray-0-dark xs:px-4 lg:bg-transparent lg:p-0 lg:dark:bg-transparent">
        <span className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark">
          {t("question")}
        </span>
        <div className="ml-auto flex h-9 flex-row text-gray-700 dark:text-gray-700-dark lg:hidden">
          <Button
            variant="secondary"
            className="!rounded border-0"
            presentationType="icon"
          >
            <FontAwesomeIcon icon={faShareNodes}></FontAwesomeIcon>
          </Button>
          <Button
            variant="secondary"
            className="!rounded border-0"
            presentationType="icon"
          >
            <FontAwesomeIcon icon={faEllipsis}></FontAwesomeIcon>
          </Button>
        </div>
      </div>
      <div className="flex w-full items-start gap-4">
        <div className="w-[48rem] max-w-full border-transparent bg-gray-0 px-3 text-gray-900 after:mt-6 after:block after:w-full after:content-[''] dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-900-dark xs:px-4 lg:border">
          <div className="my-0 flex justify-between gap-2 xs:gap-4 sm:gap-8 lg:mb-2 lg:mt-4">
            {!postData.conditional && (
              <h1 className="ng-binding m-0 text-xl leading-tight sm:text-3xl">
                {postData.title}
              </h1>
            )}
          </div>
          {!!postData.conditional && (
            <ConditionalTile
              conditional={postData.conditional}
              curationStatus={postData.curation_status}
            />
          )}
          {!!postData.group_of_questions && (
            <DetailedGroupCard
              questions={postData.group_of_questions.questions}
            />
          )}
          {!!postData.question && (
            <DetailedQuestionCard question={postData.question} />
          )}
          <ForecastMaker
            postId={postData.id}
            question={postData.question}
            conditional={postData.conditional}
            groupOfQuestions={postData.group_of_questions}
          />
          <div className="my-4 flex flex-col items-start gap-4 self-stretch border-t border-gray-300 pt-4 @container dark:border-gray-300-dark lg:hidden">
            {/*TODO: make a reusable component for this*/}
            <div className="flex flex-col self-stretch">
              <div className="flex flex-row justify-between">
                <span>Status:</span>
                <span>{postData.curation_status}</span>
              </div>
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
          {commentsData && (
            <CommentFeed initialComments={commentsData} postId={postData.id} />
          )}
        </div>
        <div className="hidden w-80 shrink-0 border border-transparent bg-gray-0 p-4 text-gray-700 dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-700-dark lg:block">
          <div className="mb-4 flex w-full items-center justify-between gap-2 border-b border-gray-300 pb-4 dark:border-gray-300-dark">
            <Button variant="secondary">Embed</Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="!rounded border-0"
                presentationType="icon"
              >
                <FontAwesomeIcon icon={faShareNodes}></FontAwesomeIcon>
              </Button>
              <Button
                variant="secondary"
                className="!rounded border-0"
                presentationType="icon"
              >
                <FontAwesomeIcon icon={faEllipsis}></FontAwesomeIcon>
              </Button>
            </div>
          </div>
          {/*TODO: make a reusable component for this*/}
          <div className="flex flex-col border-b border-gray-300 pb-4 dark:border-gray-300-dark">
            <div className="flex flex-row justify-between">
              <span>Status:</span>
              <span>{postData.curation_status}</span>
            </div>
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
      </div>
    </main>
  );
}
