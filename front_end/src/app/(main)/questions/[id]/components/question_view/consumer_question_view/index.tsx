import { useTranslations } from "next-intl";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import { checkGroupOfQuestionsPostType } from "@/components/consumer_post_card/group_forecast_card";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import {
  GroupOfQuestionsGraphType,
  PostStatus,
  PostWithForecasts,
  QuestionStatus,
} from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
} from "@/utils/questions/helpers";

import QuestionActionButton from "./action_buttons";
import ConsumerQuestionPrediction from "./prediction";
import QuestionTimeline from "./timeline";
import QuestionTitle from "../shared/question_title";

type Props = {
  postData: PostWithForecasts;
};

const ConsumerQuestionView: React.FC<Props> = ({ postData }) => {
  const t = useTranslations();

  const isFanGraph =
    postData.group_of_questions?.graph_type ===
    GroupOfQuestionsGraphType.FanGraph;

  const isDateGroup =
    postData.group_of_questions &&
    checkGroupOfQuestionsPostType(postData, QuestionType.Date);

  const reverseOrder =
    (isMultipleChoicePost(postData) || isGroupOfQuestionsPost(postData)) &&
    !(isDateGroup || isFanGraph);

  const showClosedMessageMultipleChoice =
    isMultipleChoicePost(postData) &&
    postData.question.status === QuestionStatus.CLOSED;

  const showClosedMessageFanGraph =
    isFanGraph && postData.status === PostStatus.CLOSED;

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center justify-center gap-[6px]">
        <CommentStatus
          totalCount={postData.comment_count ?? 0}
          unreadCount={postData.unread_comment_count ?? 0}
          url={getPostLink(postData)}
          className="bg-gray-200 px-2 dark:bg-gray-200-dark"
          compact
        />
        <ForecastersCounter
          forecasters={postData.nr_forecasters}
          compact={false}
        />
      </div>

      <QuestionTitle className="text-center">{postData.title}</QuestionTitle>

      <div className="mt-6 sm:mt-8">
        {showClosedMessageMultipleChoice && (
          <p className="m-0 mb-8 text-center text-sm leading-[20px] text-gray-700">
            {t("predictionClosedMessage")}
          </p>
        )}

        <div
          className={cn("flex flex-col", reverseOrder && "flex-col-reverse")}
        >
          <ConsumerQuestionPrediction postData={postData} />

          {showClosedMessageFanGraph && (
            <p className="my-8 text-center text-sm leading-[20px] text-gray-700">
              {t("predictionClosedMessage")}
            </p>
          )}

          <QuestionActionButton postData={postData} />
        </div>

        <QuestionTimeline postData={postData} />
      </div>
    </div>
  );
};

export default ConsumerQuestionView;
