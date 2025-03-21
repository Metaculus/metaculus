import { FC } from "react";

import TimeSeriesChart from "@/components/charts/time_series_chart/time_series_chart";
import { GroupOfQuestionsGraphType } from "@/types/charts";
import { GroupOfQuestionsPost, PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  checkGroupOfQuestionsPostType,
  isMultipleChoicePost,
  sortGroupPredictionOptions,
} from "@/utils/questions";

import NumericForecastCard from "./numeric_forecast_card";
import PercentageForecastCard from "./percentage_forecast_card";
import GroupContinuousTile from "../../post_card/group_of_questions_tile/group_continuous_tile";

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
  if (checkGroupOfQuestionsPostType(post, QuestionType.Numeric)) {
    return <NumericForecastCard post={post} />;
  }
  if (checkGroupOfQuestionsPostType(post, QuestionType.Date)) {
    // TODO: implement charts for date group
    return (
      <GroupContinuousTile
        post={post as GroupOfQuestionsPost<QuestionWithNumericForecasts>}
      />
    );
  }

  return null;
};

export default GroupForecastCard;
