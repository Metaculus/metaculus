import { checkGroupOfQuestionsPostType } from "@/components/consumer_post_card/group_forecast_card";
import PercentageForecastCard from "@/components/consumer_post_card/group_forecast_card/percentage_forecast_card";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { isMultipleChoicePost } from "@/utils/questions/helpers";

type Props = {
  postData: PostWithForecasts;
};

const GroupOfQuestionsPrediction: React.FC<Props> = ({ postData }) => {
  if (
    isMultipleChoicePost(postData) ||
    checkGroupOfQuestionsPostType(postData, QuestionType.Binary)
  ) {
    return (
      <div className="mt-7">
        <PercentageForecastCard post={postData} forceColorful />
      </div>
    );
  }
  return null;
};

export default GroupOfQuestionsPrediction;
