"use client";

import { useState } from "react";

import GroupTimeline from "@/app/(main)/questions/[id]/components/group_timeline";
import BinaryQuestionPrediction from "@/app/(main)/questions/[id]/components/question_view/consumer_question_view/prediction/single_question_prediction/binary_question_prediction";
import ContinuousQuestionPrediction from "@/app/(main)/questions/[id]/components/question_view/consumer_question_view/prediction/single_question_prediction/continuous_question_prediction";
import NumericTimeline from "@/components/charts/numeric_timeline";
import { GroupTimelineMarker } from "@/components/charts/primitives/timeline_markers/types";
import DateForecastCard from "@/components/consumer_post_card/group_forecast_card/date_forecast_card";
import NumericForecastCard from "@/components/consumer_post_card/group_forecast_card/numeric_forecast_card";
import PercentageForecastCard from "@/components/consumer_post_card/group_forecast_card/percentage_forecast_card";
import TimeSeriesChart from "@/components/consumer_post_card/time_series_chart";
import DetailedMultipleChoiceChartCard from "@/components/detailed_question_card/detailed_question_card/multiple_choice_chart_card";
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

import { useLaborHubChartHover } from "../labor_hub_chart_hover_context";

export function BasicQuestionContent({
  postData,
  preferTimeline,
  subQuestionId,
  timelineMarkers,
}: {
  postData: PostWithForecasts;
  preferTimeline?: boolean;
  subQuestionId?: number;
  timelineMarkers?: GroupTimelineMarker[];
}) {
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
  const laborHubHover = useLaborHubChartHover();

  if (isMultipleChoicePost(postData) && !subQuestionId) {
    if (preferTimeline) {
      return (
        <DetailedMultipleChoiceChartCard
          question={postData.question}
          chartHeight={250}
          hideTitle
        />
      );
    }
    return <PercentageForecastCard post={postData} forceColorful={false} />;
  }

  if (isGroupOfQuestionsPost(postData) && !subQuestionId) {
    if (preferTimeline) {
      return (
        <GroupTimeline
          group={postData.group_of_questions}
          timelineMarkers={timelineMarkers}
          activeTimelineMarkerId={laborHubHover?.hoveredActivityId ?? null}
          onTimelineMarkerEnter={(marker) =>
            laborHubHover?.setHoveredActivityId(marker.activityId ?? marker.id)
          }
          onTimelineMarkerLeave={() =>
            laborHubHover?.setHoveredActivityId(null)
          }
        />
      );
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
