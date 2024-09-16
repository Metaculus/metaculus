"use client";
import { useTranslations } from "next-intl";
import React, { FC, useState } from "react";

import Button from "@/app/(main)/about/components/Button";
import { useAuth } from "@/contexts/auth_context";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

import DetailsQuestionCardErrorBoundary from "./error_boundary";
import MultipleChoiceChartCard from "./multiple_choice_chart_card";
import NumericChartCard from "./numeric_chart_card";

type Props = {
  question: QuestionWithForecasts;
  nrForecasters: number;
};

const DetailedQuestionCard: FC<Props> = ({ question, nrForecasters }) => {
  const isForecastEmpty =
    question.aggregations.recency_weighted.history.length === 0;
  const { user } = useAuth();
  const [hideCommunityPrediction, setHideCommunityPrediction] = useState(
    user && user.hide_community_prediction
  );
  const t = useTranslations();
  if (isForecastEmpty) {
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
  const questionIsClosed = question.actual_close_time
    ? new Date(question.actual_close_time).getTime() < Date.now()
    : false;

  if (hideCommunityPrediction && !questionIsClosed) {
    return (
      <div className="text-center">
        <div className="text-l m-4">{t("CPIsHidden")}</div>
        <Button onClick={() => setHideCommunityPrediction(false)}>
          {t("RevealTemporarily")}
        </Button>
      </div>
    );
  }

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
    case QuestionType.Binary:
      return (
        <DetailsQuestionCardErrorBoundary>
          <NumericChartCard question={question} />
        </DetailsQuestionCardErrorBoundary>
      );
    case QuestionType.MultipleChoice:
      return (
        <DetailsQuestionCardErrorBoundary>
          <MultipleChoiceChartCard question={question} />
        </DetailsQuestionCardErrorBoundary>
      );
    default:
      return null;
  }
};

export default DetailedQuestionCard;
