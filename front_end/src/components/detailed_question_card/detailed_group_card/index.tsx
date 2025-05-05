"use client";

import { useTranslations } from "next-intl";
import React, { FC, useEffect } from "react";

import MultipleChoiceGroupChart from "@/app/(main)/questions/[id]/components/multiple_choice_group_chart";
import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import FanChart from "@/components/charts/fan_chart";
import { useHideCP } from "@/contexts/cp_context";
import {
  GroupOfQuestionsGraphType,
  GroupOfQuestionsPost,
  PostStatus,
} from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getGroupForecastAvailability } from "@/utils/questions/forecastAvailability";
import { getPostDrivenTime } from "@/utils/questions/helpers";

type Props = {
  post: GroupOfQuestionsPost<QuestionWithNumericForecasts>;
  preselectedQuestionId?: number;
  /**
   * Skips post-driven presentation.
   * Specifically useful to show timeline for fan graph groups
   */
  groupPresentationOverride?: GroupOfQuestionsGraphType;
  className?: string;
};

const DetailedGroupCard: FC<Props> = ({
  post,
  preselectedQuestionId,
  groupPresentationOverride,
  className,
}) => {
  const t = useTranslations();

  const {
    open_time,
    actual_close_time,
    scheduled_close_time,
    group_of_questions: { questions, graph_type },
    status,
  } = post;
  const refCloseTime = actual_close_time ?? scheduled_close_time;

  const { hideCP } = useHideCP();

  const presentationType = groupPresentationOverride ?? graph_type;

  const hasUserForecast = questions.some(
    (q) => !!q.my_forecasts?.history.length
  );

  useEffect(() => {
    if (groupPresentationOverride) {
      // skip event tracking as it will be tracked by details card in hero section
      return;
    }

    if (hasUserForecast) {
      sendAnalyticsEvent("visitPredictedQuestion", {
        event_category: "group",
      });
    }
  }, [groupPresentationOverride, hasUserForecast]);

  const forecastAvailability = getGroupForecastAvailability(questions);
  if (
    forecastAvailability.isEmpty &&
    forecastAvailability.cpRevealsOn &&
    status !== PostStatus.OPEN
  ) {
    return null;
  }

  switch (presentationType) {
    case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
      return (
        <>
          <MultipleChoiceGroupChart
            group={post.group_of_questions}
            actualCloseTime={getPostDrivenTime(refCloseTime)}
            openTime={getPostDrivenTime(open_time)}
            isClosed={status === PostStatus.CLOSED}
            preselectedQuestionId={preselectedQuestionId}
            hideCP={hideCP}
            className={className}
          />
          {hideCP && <RevealCPButton />}
        </>
      );
    }
    case GroupOfQuestionsGraphType.FanGraph:
      return (
        <>
          <FanChart
            group={post.group_of_questions}
            yLabel={t("communityPredictionLabel")}
            hideCP={hideCP}
            withTooltip
          />
          {hideCP && <RevealCPButton />}
        </>
      );
    default:
      return null;
  }
};

export default DetailedGroupCard;
