"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import React, { FC, useEffect } from "react";

import NumericGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/numeric_group_chart";
import MultipleChoiceGroupChart from "@/app/(main)/questions/[id]/components/multiple_choice_group_chart";
import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import { GroupOfQuestionsGraphType } from "@/types/charts";
import { PostStatus } from "@/types/post";
import {
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts";
import {
  getGroupCPRevealTime,
  getQuestionLinearChartType,
  sortGroupPredictionOptions,
} from "@/utils/questions";

import { useHideCP } from "../cp_provider";

type Props = {
  questions: QuestionWithForecasts[];
  graphType: string;
  nrForecasters: number;
  preselectedQuestionId?: number;
  isClosed?: boolean;
  actualCloseTime: string | null;
  postStatus: PostStatus;
};

const DetailedGroupCard: FC<Props> = ({
  questions,
  preselectedQuestionId,
  isClosed,
  graphType,
  nrForecasters,
  actualCloseTime,
  postStatus,
}) => {
  const t = useTranslations();
  const groupType = questions.at(0)?.type;
  const { hideCP } = useHideCP();

  useEffect(() => {
    if (questions.some((q) => !!q.my_forecasts?.history.length)) {
      sendGAEvent("event", "visitPredictedQuestion", {
        event_category: "group",
      });
    }
  }, [questions]);

  if (!groupType) {
    return (
      <div className="text-l m-4 w-full text-center">
        {t("forecastDataIsEmpty")}
      </div>
    );
  }
  const { closestCPRevealTime, isCPRevealed } = getGroupCPRevealTime(questions);
  let isForecastEmpty = true;
  let oneQuestionClosed = false;
  questions.forEach((question) => {
    if (question.aggregations.recency_weighted.history.length > 0) {
      isForecastEmpty = false;
    }
    if (
      question.actual_close_time &&
      new Date(question.actual_close_time).getTime() < Date.now()
    ) {
      oneQuestionClosed = true;
    }
  });
  if (isForecastEmpty && isCPRevealed) {
    if (postStatus !== PostStatus.OPEN) {
      return null;
    }
    return (
      <>
        {nrForecasters > 0 ? (
          <div className="text-l m-4 w-full text-center">{t("CPIsHidden")}</div>
        ) : (
          <div className="text-l m-4 w-full text-center">
            {t("forecastDataIsEmpty")}
          </div>
        )}
      </>
    );
  }

  switch (graphType) {
    case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
      const sortedQuestions = sortGroupPredictionOptions(
        questions as QuestionWithNumericForecasts[]
      );
      const timestamps = getGroupQuestionsTimestamps(sortedQuestions);
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
              actualCloseTime ? new Date(actualCloseTime).getTime() : null
            }
            isClosed={isClosed}
            preselectedQuestionId={preselectedQuestionId}
            hideCP={hideCP}
            isCPRevealed={isCPRevealed}
            cpRevealTime={closestCPRevealTime}
          />
          {hideCP && <RevealCPButton />}
        </>
      );
    }
    case GroupOfQuestionsGraphType.FanGraph:
      return (
        <NumericGroupChart
          questions={questions as QuestionWithNumericForecasts[]}
          withLabel
          isCPRevealed={isCPRevealed}
          cpRevealTime={closestCPRevealTime}
        />
      );
    default:
      return null;
  }
};

export default DetailedGroupCard;
