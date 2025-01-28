"use client";

import { useTranslations } from "next-intl";
import React, { FC } from "react";

import { useHideCP } from "@/app/(main)/questions/[id]/components/cp_provider";
import MultipleChoiceGroupChart from "@/app/(main)/questions/[id]/components/multiple_choice_group_chart";
import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import { ConditionalPost, PostConditional, PostStatus } from "@/types/post";
import {
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts";
import {
  getGroupForecastAvailability,
  getQuestionLinearChartType,
} from "@/utils/questions";

type Props = {
  post: ConditionalPost<QuestionWithForecasts>;
};

const ConditionalTimeline: FC<Props> = ({ post }) => {
  const t = useTranslations();

  const { hideCP } = useHideCP();

  const { conditional, status } = post;

  const groupType = conditional.question_no.type;
  const type = getQuestionLinearChartType(groupType);
  if (!type) {
    return null;
  }

  const questions = generateQuestions(
    t,
    conditional as PostConditional<QuestionWithNumericForecasts>
  );
  const forecastAvailability = getGroupForecastAvailability(questions);
  const timestamps = getGroupQuestionsTimestamps(questions, {
    withUserTimestamps: !!forecastAvailability.cpRevealsOn,
  });

  return (
    <div className="my-4">
      <MultipleChoiceGroupChart
        questions={questions}
        timestamps={timestamps}
        type={type}
        actualCloseTime={
          conditional.condition_child.actual_close_time
            ? new Date(conditional.condition_child.actual_close_time).getTime()
            : null
        }
        openTime={
          conditional.condition_child.open_time
            ? new Date(conditional.condition_child.open_time).getTime()
            : undefined
        }
        hideCP={hideCP}
        forecastAvailability={forecastAvailability}
        isClosed={status === PostStatus.CLOSED}
      />
      {hideCP && <RevealCPButton className="mb-3" />}
    </div>
  );
};

function generateQuestions(
  t: ReturnType<typeof useTranslations>,
  conditional: PostConditional<QuestionWithNumericForecasts>
): QuestionWithNumericForecasts[] {
  const questions: QuestionWithNumericForecasts[] = [];
  questions.push({ ...conditional.question_yes, label: t("ifYES") });
  questions.push({ ...conditional.question_no, label: t("ifNO") });

  return questions;
}

export default ConditionalTimeline;
