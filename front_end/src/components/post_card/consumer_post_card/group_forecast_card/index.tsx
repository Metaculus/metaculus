import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import {
  checkGroupOfQuestionsPostType,
  isMultipleChoicePost,
} from "@/utils/questions";

import NumericForecastCard from "./numeric_forecast_card";
import PercentageForecastCard from "./percentage_forecast_card";

type Props = {
  post: PostWithForecasts;
};

const GroupForecastCard: FC<Props> = ({ post }) => {
  if (
    isMultipleChoicePost(post) ||
    checkGroupOfQuestionsPostType(post, QuestionType.Binary)
  ) {
    return <PercentageForecastCard post={post} />;
  } else if (checkGroupOfQuestionsPostType(post, QuestionType.Numeric)) {
    // TODO: implement charts for numeric group questions
    return <NumericForecastCard post={post} />;
  } else if (checkGroupOfQuestionsPostType(post, QuestionType.Date)) {
    // TODO: implement charts for date group and time series
    return <div>Date and time series charts</div>;
  }
  return null;
};

export default GroupForecastCard;
