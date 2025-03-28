"use client";

import React, { FC } from "react";

import MultipleChoiceGroupChart from "@/app/(main)/questions/[id]/components/multiple_choice_group_chart";
import { GroupOfQuestionsGraphType } from "@/types/charts";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts";
import {
  getGroupForecastAvailability,
  getQuestionLinearChartType,
  sortGroupPredictionOptions,
} from "@/utils/questions";

import { useHideCP } from "./cp_provider";
import RevealCPButton from "./reveal_cp_button";

type Props = {
  post: PostWithForecasts;
  preselectedQuestionId?: number;
  className?: string;
};

const ForecastTimelineDrawer: FC<Props> = ({
  post,
  preselectedQuestionId,
  className,
}) => {
  const { hideCP } = useHideCP();
  const questions = post.group_of_questions
    ?.questions as QuestionWithNumericForecasts[];
  const groupType = questions?.at(0)?.type;

  if (
    !groupType ||
    post.group_of_questions?.graph_type ===
      GroupOfQuestionsGraphType.MultipleChoiceGraph
  ) {
    return null;
  }

  const forecastAvailability = getGroupForecastAvailability(questions);
  const sortedQuestions = sortGroupPredictionOptions(
    questions as QuestionWithNumericForecasts[],
    post.group_of_questions
  );
  const timestamps = getGroupQuestionsTimestamps(sortedQuestions, {
    withUserTimestamps: !!forecastAvailability.cpRevealsOn,
  });
  const isClosed = post.actual_close_time
    ? new Date(post.actual_close_time).getTime() < Date.now()
    : false;

  const type = getQuestionLinearChartType(groupType);

  if (!type) {
    return null;
  }

  return (
    <>
      <MultipleChoiceGroupChart
        questions={sortedQuestions}
        timestamps={timestamps}
        type={type}
        actualCloseTime={
          post.actual_close_time
            ? new Date(post.actual_close_time).getTime()
            : null
        }
        openTime={
          post.open_time ? new Date(post.open_time).getTime() : undefined
        }
        isClosed={isClosed}
        preselectedQuestionId={preselectedQuestionId}
        hideCP={hideCP}
        forecastAvailability={forecastAvailability}
        className={className}
      />
      {hideCP && <RevealCPButton className="mb-3" />}
    </>
  );
};

export default ForecastTimelineDrawer;
