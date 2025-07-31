import { checkGroupOfQuestionsPostType } from "@/components/consumer_post_card/group_forecast_card";
import DateForecastCard from "@/components/consumer_post_card/group_forecast_card/date_forecast_card";
import NumericForecastCard from "@/components/consumer_post_card/group_forecast_card/numeric_forecast_card";
import PercentageForecastCard from "@/components/consumer_post_card/group_forecast_card/percentage_forecast_card";
import TimeSeriesChart from "@/components/consumer_post_card/time_series_chart";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { sortGroupPredictionOptions } from "@/utils/questions/groupOrdering";
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
    if (
      postData.group_of_questions?.graph_type ===
      GroupOfQuestionsGraphType.FanGraph
    ) {
      const sortedQuestions = sortGroupPredictionOptions(
        postData.group_of_questions?.questions,
        postData.group_of_questions
      );
      content = <TimeSeriesChart questions={sortedQuestions} />;
    } else {
      content = <NumericForecastCard post={postData} />;
    }
  } else if (checkGroupOfQuestionsPostType(postData, QuestionType.Date)) {
    content = (
      <DateForecastCard
        post={postData}
        questionsGroup={postData.group_of_questions}
      />
    );
  }

  if (!content) return null;

  const wrapperClass =
    checkGroupOfQuestionsPostType(postData, QuestionType.Date) ||
    postData.group_of_questions?.graph_type ===
      GroupOfQuestionsGraphType.FanGraph
      ? "mb-7"
      : "mt-7";

  return <div className={wrapperClass}>{content}</div>;
};

export default GroupOfQuestionsPrediction;
