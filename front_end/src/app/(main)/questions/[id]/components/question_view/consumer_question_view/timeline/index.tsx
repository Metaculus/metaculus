import NumericForecastCard from "@/components/consumer_post_card/group_forecast_card/numeric_forecast_card";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import {
  GroupOfQuestionsGraphType,
  PostWithForecasts,
  QuestionStatus,
} from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  checkGroupOfQuestionsPostType,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Props = {
  postData: PostWithForecasts;
  className?: string;
  hideTitle?: boolean;
};

const QuestionTimeline: React.FC<Props> = ({
  postData,
  className,
  hideTitle,
}) => {
  const isFanGraph =
    postData.group_of_questions?.graph_type ===
    GroupOfQuestionsGraphType.FanGraph;
  const wrapperClass = cn(
    " hidden sm:block",
    isFanGraph ? "mb-8" : "mt-8",
    className
  );

  if (isQuestionPost(postData)) {
    if (postData.question.status !== QuestionStatus.UPCOMING) {
      return (
        <div className={wrapperClass}>
          <DetailedQuestionCard
            post={postData}
            hideTitle={hideTitle}
            isConsumerView={true}
          />
        </div>
      );
    }
    return null;
  }

  if (isGroupOfQuestionsPost(postData)) {
    const isDateType = checkGroupOfQuestionsPostType(
      postData,
      QuestionType.Date
    );

    return (
      <div className={wrapperClass}>
        {isDateType ? (
          <NumericForecastCard post={postData} forceColorful />
        ) : (
          <DetailedGroupCard post={postData} />
        )}
      </div>
    );
  }

  return null;
};

export function hasTimeline(postData: PostWithForecasts): boolean {
  if (isQuestionPost(postData)) {
    return postData.question.status !== QuestionStatus.UPCOMING;
  }
  if (isGroupOfQuestionsPost(postData)) {
    return true;
  }
  return false;
}

export default QuestionTimeline;
