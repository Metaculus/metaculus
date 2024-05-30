import { FC } from "react";

import MultipleChoiceCardChart from "@/components/question_card/multiple_choice_card";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getIsForecastEmpty } from "@/utils/forecasts";

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
    case QuestionType.Date:
    case QuestionType.Binary:
      return <>TODO: render time chart</>;
    case QuestionType.MultipleChoice:
      return <MultipleChoiceCardChart forecast={question.forecasts} />;
    default:
      return null;
  }
};

export default QuestionCardChart;
