import { checkGroupOfQuestionsPostType } from "@/components/consumer_post_card/group_forecast_card";
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
  const wrapperClass = cn("mt-8 hidden sm:block", className);

  if (isQuestionPost(postData)) {
    if (postData.question.status !== QuestionStatus.UPCOMING) {
      return (
        <div className={wrapperClass}>
          <DetailedQuestionCard post={postData} hideTitle={hideTitle} />
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

    if (
      postData.group_of_questions?.graph_type ===
      GroupOfQuestionsGraphType.FanGraph
    ) {
      return null;
    }

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

export default QuestionTimeline;
