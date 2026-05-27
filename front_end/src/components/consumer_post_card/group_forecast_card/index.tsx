import { FC } from "react";

import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { getGroupForecastAvailability } from "@/utils/questions/forecastAvailability";
import { sortGroupPredictionOptions } from "@/utils/questions/groupOrdering";
import {
  checkGroupOfQuestionsPostType,
  isMultipleChoicePost,
} from "@/utils/questions/helpers";

import TimeSeriesChart from "../time_series_chart";
import DateForecastCard from "./date_forecast_card";
import NumericForecastCard from "./numeric_forecast_card";
import PercentageForecastCard from "./percentage_forecast_card";

type Props = {
  post: PostWithForecasts;
  compact?: boolean;
  buttonVariant?: "primary" | "minimal";
  forFeedPage?: boolean;
};

const GroupForecastCard: FC<Props> = ({
  post,
  compact,
  buttonVariant,
  forFeedPage,
}) => {
  // Check forecast availability for group posts
  const forecastAvailability = post.group_of_questions
    ? getGroupForecastAvailability(post.group_of_questions.questions)
    : null;

  // Hide chart if no forecasts or CP not yet revealed
  const shouldHideChart =
    forecastAvailability &&
    (forecastAvailability.isEmpty || !!forecastAvailability.cpRevealsOn);

  if (
    post.group_of_questions?.graph_type === GroupOfQuestionsGraphType.FanGraph
  ) {
    const sortedQuestions = sortGroupPredictionOptions(
      post.group_of_questions?.questions,
      post.group_of_questions
    );

    // Don't render TimeSeriesChart if should hide chart
    return shouldHideChart ? null : (
      <TimeSeriesChart questions={sortedQuestions} forFeedPage={forFeedPage} />
    );
  }
  if (
    isMultipleChoicePost(post) ||
    checkGroupOfQuestionsPostType(post, QuestionType.Binary)
  ) {
    return (
      <PercentageForecastCard
        post={post}
        compact={compact}
        buttonVariant={buttonVariant}
      />
    );
  }
  if (
    checkGroupOfQuestionsPostType(post, QuestionType.Numeric) ||
    checkGroupOfQuestionsPostType(post, QuestionType.Discrete)
  ) {
    return (
      <NumericForecastCard
        post={post}
        compact={compact}
        buttonVariant={buttonVariant}
      />
    );
  }
  if (
    post.group_of_questions &&
    checkGroupOfQuestionsPostType(post, QuestionType.Date)
  ) {
    if (compact) {
      return (
        <NumericForecastCard
          post={post}
          compact
          buttonVariant={buttonVariant}
        />
      );
    }
    return (
      <DateForecastCard post={post} questionsGroup={post.group_of_questions} />
    );
  }

  return null;
};

export default GroupForecastCard;
