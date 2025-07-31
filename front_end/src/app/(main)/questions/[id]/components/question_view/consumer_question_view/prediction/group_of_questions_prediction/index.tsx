import { checkGroupOfQuestionsPostType } from "@/components/consumer_post_card/group_forecast_card";
import DateForecastCard from "@/components/consumer_post_card/group_forecast_card/date_forecast_card";
import NumericForecastCard from "@/components/consumer_post_card/group_forecast_card/numeric_forecast_card";
import PercentageForecastCard from "@/components/consumer_post_card/group_forecast_card/percentage_forecast_card";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { isMultipleChoicePost } from "@/utils/questions/helpers";

type Props = {
  postData: PostWithForecasts;
};

const GroupOfQuestionsPrediction: React.FC<Props> = ({ postData }) => {
  let content: React.ReactNode | null = null;

  if (
    isMultipleChoicePost(postData) ||
    checkGroupOfQuestionsPostType(postData, QuestionType.Binary)
  ) {
    content = <PercentageForecastCard post={postData} forceColorful />;
  } else if (checkGroupOfQuestionsPostType(postData, QuestionType.Numeric)) {
    content = <NumericForecastCard post={postData} />;
  } else if (checkGroupOfQuestionsPostType(postData, QuestionType.Date)) {
    content = (
      <DateForecastCard
        post={postData}
        questionsGroup={postData.group_of_questions}
      />
    );
  }

  if (!content) return null;

  const wrapperClass = checkGroupOfQuestionsPostType(
    postData,
    QuestionType.Date
  )
    ? "mb-7"
    : "mt-7";

  return <div className={wrapperClass}>{content}</div>;
};

export default GroupOfQuestionsPrediction;
