import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import { PostWithForecasts } from "@/types/post";
import { getPostLink } from "@/utils/navigation";

import QuestionActionButton from "./action_buttons";
import ConsumerQuestionPrediction from "./prediction";
import QuestionTimeline from "./timeline";
import QuestionTitle from "../shared/question_title";

type Props = {
  postData: PostWithForecasts;
};

const ConsumerQuestionView: React.FC<Props> = ({ postData }) => {
  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center justify-center gap-[6px]">
        <CommentStatus
          totalCount={postData.comment_count ?? 0}
          unreadCount={postData.unread_comment_count ?? 0}
          url={getPostLink(postData)}
          className="bg-gray-200 px-2 dark:bg-gray-200-dark"
          compact={true}
        />

        <ForecastersCounter
          forecasters={postData.nr_forecasters}
          compact={false}
        />
      </div>

      <QuestionTitle className="text-center">{postData.title}</QuestionTitle>

      <div className="mt-6 sm:mt-8">
        <ConsumerQuestionPrediction postData={postData} />
        <QuestionActionButton postData={postData} />
        <QuestionTimeline postData={postData} />
      </div>
    </div>
  );
};

export default ConsumerQuestionView;
