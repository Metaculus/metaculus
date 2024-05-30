import { FC } from "react";

import MultipleChoiceCardChart from "@/components/question_card/multiple_choice_card";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getIsForecastEmpty } from "@/utils/forecasts";
import NumericChartCard from "../detailed_question_card/numeric_chart_card";

type Props = {
  question: QuestionWithForecasts;
};

const QuestionCardChart: FC<Props> = ({ question }) => {
  const isForecastEmpty = getIsForecastEmpty(question.forecasts);

  if (isForecastEmpty) {
    return <div>Forecasts data is empty</div>;
  }

  switch (question.type) {
    case QuestionType.Numeric:
        return <NumericChartCard forecast={question.forecasts} />;
    case QuestionType.Date:
        return <NumericChartCard forecast={question.forecasts} />;
    case QuestionType.Binary:
        return <NumericChartCard forecast={question.forecasts} />;
    case QuestionType.MultipleChoice:
        return <MultipleChoiceCardChart forecast={question.forecasts} />;
    default:
      return null;
  }
};

export default QuestionCardChart;
