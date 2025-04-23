"use client";

import { useTranslations } from "next-intl";
import React, { FC, useEffect } from "react";

import FanGraphGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/fan_graph_group_chart";
import MultipleChoiceGroupChart from "@/app/(main)/questions/[id]/components/multiple_choice_group_chart";
import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import { GroupOfQuestionsGraphType } from "@/types/charts";
import { GroupOfQuestionsPost, PostStatus } from "@/types/post";
import {
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getGroupQuestionsTimestamps } from "@/utils/charts";
import {
  getGroupForecastAvailability,
  getQuestionLinearChartType,
  sortGroupPredictionOptions,
} from "@/utils/questions";

import { useHideCP } from "../cp_provider";

type Props = {
  post: GroupOfQuestionsPost<QuestionWithForecasts>;
  preselectedQuestionId?: number;
};

const DetailedGroupCard: FC<Props> = ({ post, preselectedQuestionId }) => {
  const t = useTranslations();

  const {
    open_time,
    actual_close_time,
    scheduled_close_time,
    group_of_questions: { questions, graph_type },
    status,
  } = post;
  const refCloseTime = actual_close_time ?? scheduled_close_time;

  const groupType = questions.at(0)?.type;
  const { hideCP } = useHideCP();

  useEffect(() => {
    if (questions.some((q) => !!q.my_forecasts?.history.length)) {
      sendAnalyticsEvent("visitPredictedQuestion", {
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
    status !== PostStatus.OPEN
  ) {
    return null;
  }

  const sortedQuestions = sortGroupPredictionOptions(
    questions as QuestionWithNumericForecasts[],
    post.group_of_questions
  );
  switch (graph_type) {
    case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
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
              refCloseTime ? new Date(refCloseTime).getTime() : null
            }
            openTime={open_time ? new Date(open_time).getTime() : undefined}
            isClosed={status === PostStatus.CLOSED}
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
            questions={sortedQuestions as QuestionWithNumericForecasts[]}
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
