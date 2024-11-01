"use client";
import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import React, { FC, useEffect } from "react";

import Button from "@/app/(main)/about/components/Button";
import { PostStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

import DetailsQuestionCardErrorBoundary from "./error_boundary";
import MultipleChoiceChartCard from "./multiple_choice_chart_card";
import NumericChartCard from "./numeric_chart_card";
import { useHideCP } from "../cp_provider";

type Props = {
  postStatus: PostStatus;
  question: QuestionWithForecasts;
  nrForecasters: number;
};

const DetailedQuestionCard: FC<Props> = ({
  postStatus,
  question,
  nrForecasters,
}) => {
  const isForecastEmpty =
    question.aggregations.recency_weighted.history.length === 0;
  const { hideCP, setCurrentHideCP } = useHideCP();

  const t = useTranslations();
  useEffect(() => {
    if (!!question.my_forecasts?.history.length) {
      sendGAEvent("event", "visitPredictedQuestion", {
        event_category: question.type,
      });
    }
  }, [question.my_forecasts?.history.length, question.type]);

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

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
    case QuestionType.Binary:
      return (
        <DetailsQuestionCardErrorBoundary>
          <NumericChartCard question={question} hideCP={hideCP} />
          {hideCP && (
            <div className="text-center">
              <div className="text-l m-4">{t("CPIsHidden")}</div>
              <Button onClick={() => setCurrentHideCP(false)}>
                {t("RevealTemporarily")}
              </Button>
            </div>
          )}
        </DetailsQuestionCardErrorBoundary>
      );
    case QuestionType.MultipleChoice:
      return (
        <DetailsQuestionCardErrorBoundary>
          <MultipleChoiceChartCard question={question} hideCP={hideCP} />
          {hideCP && (
            <div className="text-center">
              <div className="text-l m-4">{t("CPIsHidden")}</div>
              <Button onClick={() => setCurrentHideCP(false)}>
                {t("RevealTemporarily")}
              </Button>
            </div>
          )}
        </DetailsQuestionCardErrorBoundary>
      );
    default:
      return null;
  }
};

export default DetailedQuestionCard;
