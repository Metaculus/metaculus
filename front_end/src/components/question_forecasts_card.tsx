import { FC } from "react";

import MultipleChoiceChartCard from "@/components/multiple_choice_chart_card";
import NumericChartCard from "@/components/numeric_chard_card";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

type Props = {
  question: QuestionWithForecasts;
};

const QuestionForecastsCard: FC<Props> = ({ question }) => {
  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
    case QuestionType.Binary:
      return <NumericChartCard dataset={question.forecasts} />;
    case QuestionType.MultipleChoice:
      return <MultipleChoiceChartCard dataset={question.forecasts} />;
    default:
      return null;
  }
};

export default QuestionForecastsCard;
