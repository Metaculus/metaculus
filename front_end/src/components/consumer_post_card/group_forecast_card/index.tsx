import { FC } from "react";

import { useHideCP } from "@/contexts/cp_context";
import useDeferredRender from "@/hooks/use_deferred_render";
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

const FEED_TIME_SERIES_CHART_HEIGHT = 130;

const GroupForecastCard: FC<Props> = ({
  post,
  compact,
  buttonVariant,
  forFeedPage,
}) => {
  const { hideCP } = useHideCP();

  // Check forecast availability for group posts
  const forecastAvailability = post.group_of_questions
    ? getGroupForecastAvailability(post.group_of_questions.questions)
    : null;

  // Hide chart if no forecasts, CP not yet revealed, or user has hidden CP
  const shouldHideChart =
    hideCP ||
    (forecastAvailability &&
      (forecastAvailability.isEmpty || !!forecastAvailability.cpRevealsOn));

  const shouldRenderFeedTimeSeries = useDeferredRender(!!forFeedPage, post.id);

  if (
    post.group_of_questions?.graph_type === GroupOfQuestionsGraphType.FanGraph
  ) {
    if (shouldHideChart) {
      return null;
    }

    if (forFeedPage && !shouldRenderFeedTimeSeries) {
      return <div style={{ minHeight: FEED_TIME_SERIES_CHART_HEIGHT }} />;
    }

    const sortedQuestions = sortGroupPredictionOptions(
      post.group_of_questions?.questions,
      post.group_of_questions
    );

    return (
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
      <DateForecastCard
        post={post}
        questionsGroup={post.group_of_questions}
        forFeedPage={forFeedPage}
      />
    );
  }

  return null;
};

export default GroupForecastCard;
