"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import React, { FC, useEffect } from "react";

import Button from "@/app/(main)/about/components/Button";
import NumericGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/numeric_group_chart";
import { useAuth } from "@/contexts/auth_context";
import { GroupOfQuestionsGraphType } from "@/types/charts";
import { PostStatus } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts";
import { sortGroupPredictionOptions } from "@/utils/questions";

import BinaryGroupChart from "./binary_group_chart";
import ContinuousGroupTimeline from "../continuous_group_timeline";
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
  const { hideCP, setCurrentHideCP } = useHideCP();

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
  if (isForecastEmpty) {
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
      switch (groupType) {
        case QuestionType.Binary: {
          return (
            <>
              <BinaryGroupChart
                actualCloseTime={
                  actualCloseTime ? new Date(actualCloseTime).getTime() : null
                }
                questions={sortedQuestions}
                timestamps={timestamps}
                preselectedQuestionId={preselectedQuestionId}
                isClosed={isClosed}
                hideCP={hideCP}
              />
              {hideCP && (
                <div className="text-center">
                  <div className="text-l m-4">{t("CPIsHidden")}</div>
                  <Button onClick={() => setCurrentHideCP(false)}>
                    {t("RevealTemporarily")}
                  </Button>
                </div>
              )}
            </>
          );
        }
        case QuestionType.Numeric:
        case QuestionType.Date:
          return (
            <>
              <ContinuousGroupTimeline
                actualCloseTime={
                  actualCloseTime ? new Date(actualCloseTime).getTime() : null
                }
                questions={sortedQuestions}
                timestamps={timestamps}
                isClosed={isClosed}
                preselectedQuestionId={preselectedQuestionId}
                hideCP={hideCP}
              />
              {hideCP && (
                <div className="text-center">
                  <div className="text-l m-4">{t("CPIsHidden")}</div>
                  <Button onClick={() => setCurrentHideCP(false)}>
                    {t("RevealTemporarily")}
                  </Button>
                </div>
              )}
            </>
          );
        default:
          return null;
      }
    }
    case GroupOfQuestionsGraphType.FanGraph:
      return (
        <NumericGroupChart
          questions={questions as QuestionWithNumericForecasts[]}
          withLabel
        />
      );
    default:
      return null;
  }
};

export default DetailedGroupCard;
