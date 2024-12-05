"use client";

import { useTranslations } from "next-intl";
import React, { FC } from "react";

import { useHideCP } from "@/app/(main)/questions/[id]/components/cp_provider";
import MultipleChoiceGroupChart from "@/app/(main)/questions/[id]/components/multiple_choice_group_chart";
import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import { PostConditional } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts";
import { getQuestionLinearChartType } from "@/utils/questions";

type Props = {
  conditional: PostConditional<QuestionWithNumericForecasts>;
  isClosed?: boolean;
};

const ConditionalTimeline: FC<Props> = ({ conditional, isClosed }) => {
  const t = useTranslations();

  const groupType = conditional.question_no.type;
  const questions = generateQuestions(t, conditional);
  const timestamps = getGroupQuestionsTimestamps(questions);
  const { hideCP } = useHideCP();

  const type = getQuestionLinearChartType(groupType);

  if (!type) {
    return null;
  }

  return (
    <>
      <MultipleChoiceGroupChart
        questions={questions}
        timestamps={timestamps}
        type={type}
        actualCloseTime={
          conditional.condition_child.actual_close_time
            ? new Date(conditional.condition_child.actual_close_time).getTime()
            : null
        }
        hideCP={hideCP}
        isClosed={isClosed}
      />
      {hideCP && <RevealCPButton />}
    </>
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
