"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import ContinuousGroupTimeline from "@/app/(main)/questions/[id]/components/continuous_group_timeline";
import { useHideCP } from "@/app/(main)/questions/[id]/components/cp_provider";
import BinaryGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/binary_group_chart";
import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import { PostConditional } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts";

type Props = {
  conditional: PostConditional<QuestionWithNumericForecasts>;
  isClosed?: boolean;
};

const ConditionalTimeline: FC<Props> = ({ conditional, isClosed }) => {
  const groupType = conditional.question_no.type;
  const questions = [conditional.question_yes, conditional.question_no];
  const timestamps = getGroupQuestionsTimestamps(questions);
  const { hideCP } = useHideCP();
  const t = useTranslations();

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

  switch (groupType) {
    case QuestionType.Binary: {
      return (
        <BinaryGroupChart
          questions={questions}
          timestamps={timestamps}
          isClosed={isClosed}
        />
      );
    }
    case QuestionType.Numeric:
    case QuestionType.Date:
      return (
        <ContinuousGroupTimeline
          actualCloseTime={
            conditional.condition_child.actual_close_time
              ? new Date(
                  conditional.condition_child.actual_close_time
                ).getTime()
              : null
          }
          questions={questions}
          timestamps={timestamps}
          isClosed={isClosed}
        />
      );
  }
};

export default ConditionalTimeline;
