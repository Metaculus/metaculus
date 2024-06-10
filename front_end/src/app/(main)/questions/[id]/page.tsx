import {
  faEllipsis,
  faShare,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CommentFeed from "@/components/comment_feed";
import DetailedQuestionCard from "@/components/detailed_question_card";
import ForecastMakerNumeric from "@/components/forecast_maker_numeric";
import CommentsApi from "@/services/comments";
import QuestionsApi from "@/services/questions";

export default async function IndividualQuestion({
  params,
}: {
  params: { id: number };
}) {
  const questionData = await QuestionsApi.getQuestion(params.id);
  const commentsData = await CommentsApi.getComments({ question: params.id });

  return (
    <main className="flex flex-row justify-center gap-2 p-6">
      <div className="w-[700px] bg-white  p-4 dark:bg-blue-900">
        <span className="m-2 bg-blue-400 p-1 text-xl font-extrabold text-blue-700">
          Question
        </span>
        <h1 className="text-bold text-2xl dark:text-white">
          {questionData?.title}
        </h1>
        {questionData && <DetailedQuestionCard question={questionData} />}
        <div className="p-6 dark:bg-blue-800">
          {questionData && (
            <ForecastMakerNumeric question={questionData} prevSlider={null} />
          )}
        </div>
        {commentsData && <CommentFeed comments={commentsData} />}
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
            <a href={`/accounts/profile/${questionData?.author}`}>
              {questionData?.author_username}
            </a>
          </div>
          <div className="flex flex-row justify-between">
            <span>Opened:</span>
            <span>{questionData?.created_at.slice(0, 7)}</span>
          </div>
          <div className="flex flex-row justify-between">
            <span>Closed:</span>
            <span>{questionData?.closed_at.slice(0, 7)}</span>
          </div>
          <div className="flex flex-row justify-between">
            <span>Resolved:</span>
            <span>{questionData?.resolved_at.slice(0, 7)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
