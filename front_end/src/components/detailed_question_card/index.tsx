import React, { FC } from "react";

import DetailsQuestionCardEmptyState from "@/components/detailed_question_card/empty_state";
import DetailsQuestionCardErrorBoundary from "@/components/detailed_question_card/error_boundary";
import MultipleChoiceChartCard from "@/components/detailed_question_card/multiple_choice_chart_card";
import NumericChartCard from "@/components/detailed_question_card/numeric_chart_card";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getIsForecastEmpty } from "@/utils/forecasts";

type Props = {
  question: QuestionWithForecasts;
};

const DetailedQuestionCard: FC<Props> = ({ question }) => {
  const isForecastEmpty = getIsForecastEmpty(question.forecasts);

  if (isForecastEmpty) {
    return <DetailsQuestionCardEmptyState />;
  }

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
    case QuestionType.Binary:
      return (
        <DetailsQuestionCardErrorBoundary>
          <NumericChartCard
            forecast={question.forecasts}
            questionType={question.type}
          />
        </DetailsQuestionCardErrorBoundary>
      );
    case QuestionType.MultipleChoice:
      return (
        <DetailsQuestionCardErrorBoundary>
          <MultipleChoiceChartCard forecast={question.forecasts} />
        </DetailsQuestionCardErrorBoundary>
      );
    default:
      return null;
  }
};

export default DetailedQuestionCard;
