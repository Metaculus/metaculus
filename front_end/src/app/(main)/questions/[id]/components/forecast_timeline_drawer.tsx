"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { GroupOfQuestionsGraphType } from "@/types/charts";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts";
import { sortGroupPredictionOptions } from "@/utils/questions";

import ContinuousGroupTimeline from "./continuous_group_timeline";
import { useHideCP } from "./cp_provider";
import BinaryGroupChart from "./detailed_group_card/binary_group_chart";
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

  switch (groupType) {
    case QuestionType.Binary: {
      return (
        <BinaryGroupChart
          actualCloseTime={
            post.actual_close_time
              ? new Date(post.actual_close_time).getTime()
              : null
          }
          questions={sortedQuestions}
          timestamps={timestamps}
          preselectedQuestionId={preselectedQuestionId}
          isClosed={isClosed}
        />
      );
    }
    case QuestionType.Numeric:
    case QuestionType.Date:
      return (
        <ContinuousGroupTimeline
          actualCloseTime={
            post.actual_close_time
              ? new Date(post.actual_close_time).getTime()
              : null
          }
          questions={sortedQuestions}
          timestamps={timestamps}
          isClosed={isClosed}
        />
      );
  }
};

export default ForecastTimelineDrawer;
