import { FC } from "react";

import { GroupOfQuestionsGraphType } from "@/types/charts";
import { PostGroupOfQuestions, PostWithForecasts } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  sortGroupPredictionOptions,
} from "@/utils/questions";

import DateForecastCard from "./date_forecast_card";
import NumericForecastCard from "./numeric_forecast_card";
import PercentageForecastCard from "./percentage_forecast_card";
import TimeSeriesChart from "../time_series_chart";

type Props = {
  post: PostWithForecasts;
};

const GroupForecastCard: FC<Props> = ({ post }) => {
  if (
    post.group_of_questions?.graph_type === GroupOfQuestionsGraphType.FanGraph
  ) {
    const sortedQuestions = sortGroupPredictionOptions(
      post.group_of_questions?.questions as QuestionWithNumericForecasts[],
      post.group_of_questions
    );

    return <TimeSeriesChart questions={sortedQuestions} />;
  }
  if (
    isMultipleChoicePost(post) ||
    checkGroupOfQuestionsPostType(post, QuestionType.Binary)
  ) {
    return <PercentageForecastCard post={post} />;
  }
  if (
    checkGroupOfQuestionsPostType(post, QuestionType.Numeric) ||
    checkGroupOfQuestionsPostType(post, QuestionType.Discrete)
  ) {
    return <NumericForecastCard post={post} />;
  }
  if (
    post.group_of_questions &&
    checkGroupOfQuestionsPostType(post, QuestionType.Date)
  ) {
    return <DateForecastCard questionsGroup={post.group_of_questions} />;
  }

  return null;
};

function checkGroupOfQuestionsPostType<T extends QuestionType>(
  post: PostWithForecasts,
  type: T
): post is PostWithForecasts & {
  group_of_questions: PostGroupOfQuestions<QuestionWithForecasts & { type: T }>;
} {
  return (
    isGroupOfQuestionsPost(post) &&
    post.group_of_questions.questions[0]?.type === type
  );
}

export default GroupForecastCard;
