import { FC } from "react";

import TimeSeriesChart from "@/components/charts/time_series_chart";
import { GroupOfQuestionsGraphType } from "@/types/charts";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  checkGroupOfQuestionsPostType,
  isMultipleChoicePost,
} from "@/utils/questions";

import NumericForecastCard from "./numeric_forecast_card";
import PercentageForecastCard from "./percentage_forecast_card";
import PostCard from "../..";

type Props = {
  post: PostWithForecasts;
};

const GroupForecastCard: FC<Props> = ({ post }) => {
  if (
    post.group_of_questions?.graph_type === GroupOfQuestionsGraphType.FanGraph
  ) {
    return (
      <TimeSeriesChart
        questions={
          post.group_of_questions.questions as QuestionWithNumericForecasts[]
        }
      />
    );
  } else {
    if (
      isMultipleChoicePost(post) ||
      checkGroupOfQuestionsPostType(post, QuestionType.Binary)
    ) {
      return <PercentageForecastCard post={post} />;
    } else if (checkGroupOfQuestionsPostType(post, QuestionType.Numeric)) {
      return <NumericForecastCard post={post} />;
    } else if (checkGroupOfQuestionsPostType(post, QuestionType.Date)) {
      // TODO: implement charts for date group
      return <PostCard post={post} />;
    }
  }
  return null;
};

export default GroupForecastCard;
