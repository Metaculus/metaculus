import { FC } from "react";

import MultipleChoiceChartCard from "@/components/detailed_question_card/multiple_choice_chart_card";
import NumericChartCard from "@/components/detailed_question_card/numeric_chard_card";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

type Props = {
  question: QuestionWithForecasts;
};

const DetailedQuestionCard: FC<Props> = ({ question }) => {
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

export default DetailedQuestionCard;
