import { FC } from "react";

import ForecastMakerBinary from "@/components/forecast_maker/forecast_maker_binary";
import ForecastMakerNumeric from "@/components/forecast_maker/forecast_maker_numeric";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

type Props = {
  question: QuestionWithForecasts;
};

const ForecastMaker: FC<Props> = ({ question }) => {
  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
      return <ForecastMakerNumeric question={question} prevSlider={null} />;
    case QuestionType.Binary:
      return <ForecastMakerBinary question={question} />;
    default:
      return null;
  }
};

export default ForecastMaker;
