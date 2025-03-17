import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { checkGroupOfQuestionsPostType, isMcQuestion } from "@/utils/questions";

import BinaryGroupForecastChart from "./binary_group_forecast_chart";
import NumericGroupForecastChart from "./numeric_group_forecast_chart";

type Props = {
  post: PostWithForecasts;
};

const GroupForecastChart: FC<Props> = ({ post }) => {
  if (
    isMcQuestion(post.question) ||
    checkGroupOfQuestionsPostType(post, QuestionType.Binary)
  ) {
    return <BinaryGroupForecastChart post={post} />;
  } else if (checkGroupOfQuestionsPostType(post, QuestionType.Numeric)) {
    // TODO: implement charts for numeric group questions
    return <NumericGroupForecastChart post={post} />;
  } else if (checkGroupOfQuestionsPostType(post, QuestionType.Date)) {
    // TODO: implement charts for date group and time series
    return <div>Date and time series charts</div>;
  }
  return null;
};

export default GroupForecastChart;
