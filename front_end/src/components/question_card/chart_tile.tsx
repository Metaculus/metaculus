import { FC } from "react";

import MultipleChoiceTile from "@/components/question_card/multiple_choice_tile";
import NumericTile from "@/components/question_card/numeric_tile";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getIsForecastEmpty } from "@/utils/forecasts";

type Props = {
  question: QuestionWithForecasts;
};

const QuestionChartTile: FC<Props> = ({ question }) => {
  const isForecastEmpty = getIsForecastEmpty(question.forecasts);

  if (isForecastEmpty) {
    return <div>Forecasts data is empty</div>;
  }

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
    case QuestionType.Binary:
      return <NumericTile forecast={question.forecasts} />;
    case QuestionType.MultipleChoice:
      return <MultipleChoiceTile forecast={question.forecasts} />;
    default:
      return null;
  }
};

export default QuestionChartTile;
