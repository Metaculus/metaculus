"use client";
import React, { FC, useEffect } from "react";

import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import { useHideCP } from "@/contexts/cp_context";
import { PostStatus, QuestionPost } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";

import DetailedContinuousChartCard from "./continuous_chart_card";
import DetailsQuestionCardErrorBoundary from "./error_boundary";
import DetailedMultipleChoiceChartCard from "./multiple_choice_chart_card";

type Props = {
  post: QuestionPost<QuestionWithForecasts>;
  hideTitle?: boolean;
  isConsumerView?: boolean;
  embedChartHeight?: number;
};

const DetailedQuestionCard: FC<Props> = ({
  post,
  hideTitle,
  isConsumerView,
  embedChartHeight,
}) => {
  const { question, status, nr_forecasters } = post;
  const forecastAvailability = getQuestionForecastAvailability(question);

  const { hideCP } = useHideCP();

  useEffect(() => {
    if (!!question.my_forecasts?.history.length) {
      sendAnalyticsEvent("visitPredictedQuestion", {
        event_category: question.type,
      });
    }
  }, [question.my_forecasts?.history.length, question.type]);

  if (forecastAvailability.isEmpty && status !== PostStatus.OPEN) {
    return null;
  }

  switch (question.type) {
    case QuestionType.Binary:
    case QuestionType.Numeric:
    case QuestionType.Discrete:
    case QuestionType.Date:
      return (
        <DetailsQuestionCardErrorBoundary>
          <DetailedContinuousChartCard
            question={question}
            hideCP={hideCP}
            forecastAvailability={forecastAvailability}
            nrForecasters={nr_forecasters}
            hideTitle={hideTitle}
            isConsumerView={isConsumerView}
            embedChartHeight={embedChartHeight}
          />
          {hideCP && <RevealCPButton />}
        </DetailsQuestionCardErrorBoundary>
      );
    case QuestionType.MultipleChoice:
      return (
        <DetailsQuestionCardErrorBoundary>
          <DetailedMultipleChoiceChartCard
            question={question}
            hideCP={hideCP}
            forecastAvailability={forecastAvailability}
          />
          {hideCP && <RevealCPButton />}
        </DetailsQuestionCardErrorBoundary>
      );
    default:
      return null;
  }
};

export default DetailedQuestionCard;
