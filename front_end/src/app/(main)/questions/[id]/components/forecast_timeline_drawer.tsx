"use client";

import { useTranslations } from "next-intl";
import React, { FC } from "react";

import MultipleChoiceGroupChart from "@/app/(main)/questions/[id]/components/multiple_choice_group_chart";
import { GroupOfQuestionsGraphType } from "@/types/charts";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts";
import {
  getQuestionLinearChartType,
  sortGroupPredictionOptions,
} from "@/utils/questions";

import { useHideCP } from "./cp_provider";
import RevealCPButton from "./reveal_cp_button";

type Props = {
  post: PostWithForecasts;
  preselectedQuestionId?: number;
};

const ForecastTimelineDrawer: FC<Props> = ({ post, preselectedQuestionId }) => {
  const { hideCP } = useHideCP();
  const t = useTranslations();
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

  if (hideCP) {
    return (
      <>
        <h3 className="m-0 text-start text-base font-normal leading-5">
          {t("forecastTimelineHeading")}
        </h3>
        <RevealCPButton />
      </>
    );
  }
  const sortedQuestions = sortGroupPredictionOptions(
    questions as QuestionWithNumericForecasts[]
  );
  const timestamps = getGroupQuestionsTimestamps(sortedQuestions);
  const isClosed = post.actual_close_time
    ? new Date(post.actual_close_time).getTime() < Date.now()
    : false;

  const type = getQuestionLinearChartType(groupType);

  if (!type) {
    return null;
  }

  return (
    <MultipleChoiceGroupChart
      questions={sortedQuestions}
      timestamps={timestamps}
      type={type}
      actualCloseTime={
        post.actual_close_time
          ? new Date(post.actual_close_time).getTime()
          : null
      }
      isClosed={isClosed}
      preselectedQuestionId={preselectedQuestionId}
    />
  );
};

export default ForecastTimelineDrawer;
