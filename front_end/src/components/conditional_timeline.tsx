"use client";

import { useTranslations } from "next-intl";
import React, { FC } from "react";

import MultipleChoiceGroupChart from "@/app/(main)/questions/[id]/components/group_timeline";
import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import { useHideCP } from "@/contexts/cp_context";
import { ConditionalPost, PostConditional, PostStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getPostDrivenTime } from "@/utils/questions/helpers";

type Props = {
  post: ConditionalPost<QuestionWithNumericForecasts>;
};

const ConditionalTimeline: FC<Props> = ({ post }) => {
  const t = useTranslations();

  const { hideCP } = useHideCP();

  const { conditional, status } = post;

  const questions = generateQuestions(t, conditional);

  return (
    <div className="my-4">
      <MultipleChoiceGroupChart
        questions={questions}
        actualCloseTime={getPostDrivenTime(
          conditional.condition_child.actual_close_time
        )}
        openTime={getPostDrivenTime(conditional.condition_child.open_time)}
        hideCP={hideCP}
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
