"use client";

import { useState } from "react";

import GroupTimeline from "@/app/(main)/questions/[id]/components/group_timeline";
import BinaryQuestionPrediction from "@/app/(main)/questions/[id]/components/question_view/consumer_question_view/prediction/single_question_prediction/binary_question_prediction";
import ContinuousQuestionPrediction from "@/app/(main)/questions/[id]/components/question_view/consumer_question_view/prediction/single_question_prediction/continuous_question_prediction";
import NumericTimeline from "@/components/charts/numeric_timeline";
import DateForecastCard from "@/components/consumer_post_card/group_forecast_card/date_forecast_card";
import NumericForecastCard from "@/components/consumer_post_card/group_forecast_card/numeric_forecast_card";
import PercentageForecastCard from "@/components/consumer_post_card/group_forecast_card/percentage_forecast_card";
import TimeSeriesChart from "@/components/consumer_post_card/time_series_chart";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import {
  getGroupForecastAvailability,
  getQuestionForecastAvailability,
} from "@/utils/questions/forecastAvailability";
import { sortGroupPredictionOptions } from "@/utils/questions/groupOrdering";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isQuestionPost,
  getPostDrivenTime,
} from "@/utils/questions/helpers";

export function BasicQuestionContent({
  postData,
  preferTimeline,
  subQuestionId,
}: {
  postData: PostWithForecasts;
  preferTimeline?: boolean;
  subQuestionId?: number;
}) {
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);

  if (isMultipleChoicePost(postData) && !subQuestionId) {
    return <PercentageForecastCard post={postData} forceColorful={false} />;
  }

  if (isGroupOfQuestionsPost(postData) && !subQuestionId) {
    if (preferTimeline) {
      return <GroupTimeline group={postData.group_of_questions} />;
    }
    switch (postData.group_of_questions?.questions[0]?.type) {
      case QuestionType.Binary:
        return <PercentageForecastCard post={postData} forceColorful={false} />;
      case QuestionType.Numeric:
        if (
          postData.group_of_questions?.graph_type ===
          GroupOfQuestionsGraphType.FanGraph
        ) {
          // Check forecast availability for fan graphs
          const forecastAvailability = postData.group_of_questions
            ? getGroupForecastAvailability(
                postData.group_of_questions.questions
              )
            : null;

          // Hide chart if no forecasts or CP not yet revealed
          const shouldHideChart =
            forecastAvailability &&
            (forecastAvailability.isEmpty ||
              !!forecastAvailability.cpRevealsOn);

          if (!shouldHideChart) {
            const sortedQuestions = sortGroupPredictionOptions(
              postData.group_of_questions?.questions,
              postData.group_of_questions
            );
            return <TimeSeriesChart questions={sortedQuestions} height={180} />;
          }
        } else {
          return <NumericForecastCard post={postData} />;
        }
      case QuestionType.Date:
        return (
          <DateForecastCard
            post={postData}
            questionsGroup={postData.group_of_questions}
          />
        );
      default:
        return null;
    }
  }
  const question = subQuestionId
    ? postData.group_of_questions?.questions.find(
        (question) => question.id === subQuestionId
      )
    : postData.question;

  if ((isQuestionPost(postData) || subQuestionId) && question) {
    if (preferTimeline) {
      const forecastAvailability = getQuestionForecastAvailability(question);
      return (
        <NumericTimeline
          aggregation={
            question.aggregations[question.default_aggregation_method]
          }
          resolution={question.resolution}
          resolveTime={question.actual_resolve_time}
          height={180}
          questionType={question.type}
          actualCloseTime={getPostDrivenTime(question.actual_close_time)}
          scaling={question.scaling}
          onCursorChange={setCursorTimestamp}
          cursorTimestamp={cursorTimestamp}
          nonInteractive={false}
          isEmptyDomain={
            forecastAvailability.isEmpty || !!forecastAvailability.cpRevealsOn
          }
          openTime={getPostDrivenTime(question.open_time)}
          unit={question.unit}
          tickFontSize={9}
          simplifiedCursor={false}
          inboundOutcomeCount={question.inbound_outcome_count}
          questionStatus={question.status}
        />
      );
    }
    switch (question.type) {
      case QuestionType.Binary:
        return (
          <BinaryQuestionPrediction question={question} canPredict={false} />
        );
      case QuestionType.Numeric:
      case QuestionType.Discrete:
      case QuestionType.Date:
        return <ContinuousQuestionPrediction question={question} />;
      default:
        return null;
    }
  }

  return null;
}
