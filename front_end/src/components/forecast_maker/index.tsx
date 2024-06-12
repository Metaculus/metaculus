import { FC } from "react";

import ForecastMakerBinary from "@/components/forecast_maker/forecast_maker_binary";
import ForecastMakerMultipleChoice from "@/components/forecast_maker/forecast_maker_multiple_choice";
import ForecastMakerNumeric from "@/components/forecast_maker/forecast_maker_numeric";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

type Props = {
  question: QuestionWithForecasts;
};

const ForecastMaker: FC<Props> = ({ question }) => {
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
      return <ForecastMakerMultipleChoice question={question} />;
    default:
      return null;
  }
};

export default ForecastMaker;
