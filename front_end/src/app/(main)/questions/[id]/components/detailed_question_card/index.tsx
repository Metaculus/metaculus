"use client";
import { sendGAEvent } from "@next/third-parties/google";
import React, { FC, useEffect } from "react";

import { PostStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getQuestionForecastAvailability } from "@/utils/questions";

import DetailedContinuousChartCard from "./continuous_chart_card";
import DetailsQuestionCardErrorBoundary from "./error_boundary";
import DetailedMultipleChoiceChartCard from "./multiple_choice_chart_card";
import { useHideCP } from "../cp_provider";
import RevealCPButton from "../reveal_cp_button";

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
  const forecastAvailability = getQuestionForecastAvailability(question);

  const { hideCP } = useHideCP();

  useEffect(() => {
    if (!!question.my_forecasts?.history.length) {
      sendGAEvent("event", "visitPredictedQuestion", {
        event_category: question.type,
      });
    }
  }, [question.my_forecasts?.history.length, question.type]);

  if (forecastAvailability.isEmpty && postStatus !== PostStatus.OPEN) {
    return null;
  }

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
    case QuestionType.Binary:
      return (
        <DetailsQuestionCardErrorBoundary>
          <DetailedContinuousChartCard
            question={question}
            hideCP={hideCP}
            forecastAvailability={forecastAvailability}
            nrForecasters={nrForecasters}
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
