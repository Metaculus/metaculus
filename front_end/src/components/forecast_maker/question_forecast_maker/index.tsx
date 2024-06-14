import { FC } from "react";

import { MultiSliderValue } from "@/components/sliders/multi_slider";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

import ForecastMakerBinary from "./forecast_maker_binary";
import ForecastMakerMultipleChoice from "./forecast_maker_multiple_choice";
import ForecastMakerNumeric from "./forecast_maker_numeric";

type Props = {
  question: QuestionWithForecasts;
};

const QuestionForecastMaker: FC<Props> = ({ question }) => {
  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
      return (
        <ForecastMakerNumeric
          question={question}
          prevForecast={
            question.forecasts.my_forecasts?.slider_values
              ?.forecast as MultiSliderValue[]
          }
          prevWeights={
            question.forecasts.my_forecasts?.slider_values?.weights as number[]
          }
        />
      );
    case QuestionType.Binary:
      return (
        <ForecastMakerBinary
          question={question}
          prevForecast={question.forecasts.my_forecasts?.slider_values}
        />
      );
    case QuestionType.MultipleChoice:
      return (
        <ForecastMakerMultipleChoice
          question={question}
          prevForecast={question.forecasts.my_forecasts?.slider_values}
        />
      );
    default:
      return null;
  }
};

export default QuestionForecastMaker;
