"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import React, { FC, useEffect } from "react";

import FanGraphGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/fan_graph_group_chart";
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
  getGroupForecastAvailability,
  getQuestionLinearChartType,
  sortGroupPredictionOptions,
} from "@/utils/questions";

import { useHideCP } from "../cp_provider";

type Props = {
  questions: QuestionWithForecasts[];
  graphType: string;
  preselectedQuestionId?: number;
  isClosed?: boolean;
  actualCloseTime: string | null;
  openTime: string | null;
  postStatus: PostStatus;
};

const DetailedGroupCard: FC<Props> = ({
  questions,
  preselectedQuestionId,
  isClosed,
  graphType,
  actualCloseTime,
  openTime,
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
  const forecastAvailability = getGroupForecastAvailability(questions);
  if (
    forecastAvailability.isEmpty &&
    forecastAvailability.cpRevealsOn &&
    postStatus !== PostStatus.OPEN
  ) {
    return null;
  }

  switch (graphType) {
    case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
      const sortedQuestions = sortGroupPredictionOptions(
        questions as QuestionWithNumericForecasts[]
      );
      const timestamps = getGroupQuestionsTimestamps(sortedQuestions, {
        withUserTimestamps: !!forecastAvailability.cpRevealsOn,
      });
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
            openTime={openTime ? new Date(openTime).getTime() : undefined}
            isClosed={isClosed}
            preselectedQuestionId={preselectedQuestionId}
            hideCP={hideCP}
            forecastAvailability={forecastAvailability}
          />
          {hideCP && <RevealCPButton />}
        </>
      );
    }
    case GroupOfQuestionsGraphType.FanGraph:
      return (
        <>
          <FanGraphGroupChart
            questions={questions as QuestionWithNumericForecasts[]}
            withLabel
            hideCP={hideCP}
            forecastAvailability={forecastAvailability}
          />
          {hideCP && <RevealCPButton />}
        </>
      );
    default:
      return null;
  }
};

export default DetailedGroupCard;
